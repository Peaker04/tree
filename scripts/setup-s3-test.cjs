const { S3Client, CreateBucketCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

async function main() {
  const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
  const region = process.env.S3_REGION || 'us-east-1';
  const bucket = process.env.S3_BUCKET || 'novyx-evidence';
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || 'minioadmin';
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || 'minioadminpassword';

  const client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`Successfully created test S3 bucket: ${bucket}`);
  } catch (err) {
    if (
      err.name === 'BucketAlreadyOwnedByYou' ||
      err.name === 'BucketAlreadyExists' ||
      err.$metadata?.httpStatusCode === 409
    ) {
      console.log(`Test S3 bucket already exists: ${bucket}`);
    } else {
      console.error(`Failed to create test S3 bucket:`, err.message);
      process.exit(1);
    }
  }

  // Verify bucket accessibility
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Verified test S3 bucket is accessible: ${bucket}`);
  } catch (err) {
    console.error(`Failed to verify bucket accessibility:`, err.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error setting up test S3:', err);
  process.exit(1);
});
