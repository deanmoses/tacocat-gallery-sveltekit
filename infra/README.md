# Account setup deployed by hand

Things that must exist in the AWS account before CI can run, and so are deployed by hand rather than by CI.

## GitHub Actions roles

[github-oidc.yaml](github-oidc.yaml) creates the two roles the workflows assume: `main` deploys staging, `prod` deploys production. Each can sync one site bucket and invalidate one CloudFront distribution, both owned by the [tacocat-gallery-hosting-aws](https://github.com/deanmoses/tacocat-gallery-hosting-aws) stacks, and nothing else. The template's header comment explains how they fit together. The GitHub OIDC identity provider they trust is account-wide and lives in the [aws-bootstrap](https://github.com/deanmoses/aws-bootstrap) repo.

Deploy or update with admin credentials:

```bash
aws cloudformation deploy --template-file infra/github-oidc.yaml --stack-name tacocat-gallery-sveltekit-cicd --capabilities CAPABILITY_NAMED_IAM
```

The role ARNs are stable, so the workflows reference them directly. If you rename a role, update `.github/workflows/*.yml` to match. If the hosting stacks ever get a new bucket or distribution, update the template's parameter defaults and `scripts/deploy-*.sh` together.

There are no AWS secrets in the GitHub repository. A workflow job gets a short-lived credential by presenting its OIDC token, and which role it may assume is decided by the token's `sub` claim: runs on `main`, or the `prod` GitHub environment. Pull requests only build and test, so they assume no role. The prod role's trust depends only on the `prod` environment's protected-branch rule: the environment is configured in the repository settings to deploy only from protected branches, of which `main` is the only one. There is no reviewer gate: the pull request into `main` is the review.

## Claude Code on the web

The same template lets a cloud session do what `npm run deploy-staging` does: sync the built site into the staging bucket and invalidate that distribution. That is the reach the `main` CI role has. The production site is out of reach under an explicit `Deny`, because `scripts/deploy-prod.sh` differs from the staging script only in which bucket and distribution it names.

Reading the CloudFront access logs that `production_logs/` analyses is not granted here. Those buckets belong to the hosting and gallery stacks, so those repos grant them, the same way this repo grants the site bucket.

A session authenticates as one IAM user for the whole account, `tacocat-gallery-claude-code-cloud`, and that user is created by the [tacocat-gallery-sam](https://github.com/deanmoses/tacocat-gallery-sam) repo's `infra/`. **That stack has to be deployed before this one**, or the policy here has no user to attach to and the deploy fails. What the user may do in this project is still decided here: this template attaches its own managed policy, so the permissions live with the project rather than accumulating in another repo's template. The other Tacocat repos do the same.

One thing to watch when adding another repo to that arrangement: AWS allows ten managed policies per IAM user by default. This template attaches one of them.
