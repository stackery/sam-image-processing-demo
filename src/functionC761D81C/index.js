const AWS = require('aws-sdk');
const gm = require('gm').subClass({imageMagick: true});
const s3 = new AWS.S3();

module.exports = function handler (event, context, callback) {
  console.log(event);

  let record = event.Records[0];
  if (record.eventName !== 'ObjectCreated:Put') {
    return;
  }
  let sourceBucket = record.s3.bucket.name;
  let objectKey = record.s3.object.key;

  // Only operate on image files
  // For simplicity in this guide, we'll only operate on '.jpg' files
  let result = objectKey.match(/(.*)\.jpg$/);
  if (!result) {
    return;
  }
  let imageBuffer;
  let params = {
    Key: objectKey,
    Bucket: sourceBucket
  };

  // Retrieve image from ObjectStore "Uploaded Images"
  s3.getObject(params).promise()
    .then((data) => {
      return new Promise((resolve, reject) => {
        imageBuffer = data.Body;

        // imageMagick create a 200x200 thumbnail
        gm(imageBuffer)
          .resize(200, 200)
          .stream((err, stdout, stderr) => {
            let chunks = [];

            stdout.on('data', (chunk) => {
              chunks.push(chunk);
            });

            stdout.on('end', () => {
              resolve(Buffer.concat(chunks));
            });

            if (err) {
              console.log(`Error resizing image: ${err}`);
              reject(err);
            }

            stderr.on('data', function (data) {
              console.log(`Error resizing image: ${data}`);
              reject(new Error('Error resizing image'));
            });
          });
      });
    })
    .then((outputBuffer) => {
      // Store generated thumbnail to Object Store "Processed Images"
      // We look up the S3 bucket using the STACKERY_PORTS env var
      const ports = JSON.parse(process.env.STACKERY_PORTS);
      let params = {
        Body: outputBuffer.toString('binary'),
        Key: `200x200-${objectKey}`,
        Bucket: ports[0][0].bucket
      };
      return s3.putObject(params).promise();
    })
    .then((response) => {
      // Done!
      callback(null, {});
    })
    .catch((error) => {
      callback(error);
    });
};
