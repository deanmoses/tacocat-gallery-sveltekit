# Tacocat ecosystem

Tacocat is multiple Github repos deployed into AWS account `010410881828`, everything `us-east-1`.

## Repos

- `tacocat-gallery-sveltekit`: the SPA's source code; builds static assets that deploy into the `tacocat-gallery-hosting-aws` stack.
- `tacocat-gallery-hosting-aws`: the S3 bucket and CloudFront distribution that serve the `tacocat-gallery-sveltekit` SPA.
- `tacocat-gallery-sam`: backend - DynamoDB, Lambdas (EXIF, resizing, transcoding, Redis sync), API Gateway, S3 media, the image CDN.
- `tacocat-gallery-auth`: Cognito OAuth2 login: four Lambdas that exchange auth codes for tokens held in HttpOnly cookies.
- Redis Labs: not a repo, manually configured via UI. Used for the website's search.

## Domains

A guest loads the SPA from `pix`, which fetches album JSON from `api` and thumbnails from `img`. Admins additionally hit `auth`, which redirects to Cognito's hosted UI.

| Domain                 | Serves               | Fronted by  | Defined in                                                                         |
| ---------------------- | -------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `pix.tacocat.com`      | the SPA              | CloudFront  | `tacocat-gallery-hosting-aws` (distribution), `tacocat-gallery-sveltekit` (assets) |
| `api.pix.tacocat.com`  | album/image API      | API Gateway | `tacocat-gallery-sam`                                                              |
| `img.pix.tacocat.com`  | image CDN            | CloudFront  | `tacocat-gallery-sam`                                                              |
| `auth.pix.tacocat.com` | login/logout/session | API Gateway | `tacocat-gallery-auth`                                                             |
| `login.tacocat.com`    | Cognito hosted UI    | Cognito     | `tacocat-gallery-auth`                                                             |

`api` and `auth` are API Gateway custom domains, not CloudFront distributions — the account has five distributions, all SPA or image.

## Environments

**The stacks say `dev`; the site says `staging`. Same environment.**

| Environment   | Site                      | Stacks                                                                                          |
| ------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| dev / staging | `staging-pix.tacocat.com` | `tacocat-gallery-sam-dev`, `tacocat-gallery-website-hosting-dev`, `tacocat-gallery-auth-dev`    |
| test          | none                      | `tacocat-gallery-sam-test` only                                                                 |
| prod          | `pix.tacocat.com`         | `tacocat-gallery-sam-prod`, `tacocat-gallery-website-hosting-prod`, `tacocat-gallery-auth-prod` |

Test is backend-only, for CI integration tests: `api.test-pix` and `img.test-pix` exist, but there is no test SPA and no test auth.

Both Cognito environments share one user pool at `login.tacocat.com`, so the same credentials work against staging and prod.
