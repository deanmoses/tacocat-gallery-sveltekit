#!/bin/bash

cloudfront_distribution_id=E13M70NHFSSCUR

echo "Deploying files to S3..."
aws s3 sync build s3://tacocat-gallery-website-hosting-dev-bucket/ --delete --exclude '.DS_Store' --exclude '.well-known'

echo "Kicking off CloudFront invalidation..."
invalidation_id=$(aws cloudfront create-invalidation --distribution-id $cloudfront_distribution_id --paths "/*" --output json --query Invalidation.Id)
invalidation_id="${invalidation_id//\"/}" # Remove quotes from around ID

# Wait for cloudfront invalidation to complete
echo "Waiting for CloudFront invalidation to complete..."
aws cloudfront wait invalidation-completed --distribution-id $cloudfront_distribution_id --id $invalidation_id

# Get cloudfront domain name and validate
cloudfront_domain_name=$(aws cloudfront list-distributions --query "DistributionList.Items[?Id=='$cloudfront_distribution_id'].DomainName" --output text)

echo "CloudFront invalidation is complete - please visit your CloudFront URL to test: $cloudfront_domain_name"
