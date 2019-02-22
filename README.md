# Stackery Image Processing Demo - NodeJS

This is a sample template for a serverless AWS Lambda application, written in NodeJS.

The application does image processing; images deposited in the "Uploaded Images"
S3 bucket are resized to thumbnails, which are then added to the "Processed Images"
bucket.

The application architecture is defined in template.yaml, a Serverless
Application Model (SAM) template which can be managed through the Stackery UI
at app.stackery.io.

Here is an overview of the files:

```text
.
├── README.md                          <-- This README file
├── src                                <-- Source code dir for all AWS Lambda functions
│   └── imageProcessor                 <-- Source code dir for imageProcessor function
│       ├── package.json               <-- Package dependencies for the function code
│       └── index.js                   <-- Lambda imageProcessor function code
└── template.yaml                      <-- SAM infrastructure-as-code template
```

Clone this stack in Stackery, deploy it, and test it as follows:

- In the Stackery dashboard's "Deployments" tab, click on the S3 bucket resource
named "Uploaded Images".  Click on the bucket's ARN to view the AWS S3 Management
Console for the bucket.  Upload a large image.  Use the same procedure to find the
"Processed Images" bucket in the S3 Management Console and look for the resized
image.
