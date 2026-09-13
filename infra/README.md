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
