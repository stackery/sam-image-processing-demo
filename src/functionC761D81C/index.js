const AWS = require('aws-sdk');
const gm = require('gm').subClass({ imageMagick: true });
const s3 = new AWS.S3();

module.exports.handler = async message => {
  console.log(message);

  let record = message.Records[0];
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
  console.log(`Retrieving image from ObjectStore 'Uploaded Images'`);
  let data = await s3.getObject(params).promise();
  console.log(`Retrieved image from ObjectStore 'Uploaded Images'`);
  imageBuffer = data.Body;

  // imageMagick create a 200x200 thumbnail
  let gmPromise = new Promise((resolve, reject) => { 
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

  console.log(`Creating thumbnail`);
  let outputBuffer = await gmPromise;
  console.log(`Created thumbnail`);

  // Store generated thumbnail to Object Store "Processed Images"
  params = {
    Body: outputBuffer.toString('binary'),
    Key: `200x200-${objectKey}`,
    Bucket: process.env.BUCKET_NAME
  };
  console.log(`Storing thumbnailed in Object Store ${process.env.BUCKET_NAME}`);
  await s3.putObject(params).promise();
  console.log(`Storedthumbnailed in Object Store ${process.env.BUCKET_NAME}`);

  // Done!
  return {};
};
