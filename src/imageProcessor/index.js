const AWS = require('aws-sdk');
const sharp = require('sharp');

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

  console.log(`Creating thumbnail`);
  const outputBuffer = await sharp(imageBuffer).resize(200).toBuffer();
  console.log(`Created thumbnail`);

  // Store generated thumbnail to Object Store "Processed Images"
  params = {
    Body: outputBuffer,
    Key: `resized-${objectKey}`,
    Bucket: process.env.BUCKET_NAME
  };
  console.log(`Storing thumbnail in Object Store ${process.env.BUCKET_NAME}`);
  result = await s3.putObject(params).promise();
  console.log('Stored thumbnail:', result);

  return {};
};
