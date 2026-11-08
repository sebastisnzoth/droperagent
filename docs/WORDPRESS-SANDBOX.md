# WordPress / WooCommerce sandbox

This branch provides a **test/development environment**, not a public production WordPress site.

## GitHub Actions
The `WordPress + WooCommerce Integration (Sandbox)` workflow brings up MariaDB and WordPress, installs WordPress through WP-CLI, installs the real WooCommerce plugin, creates a WooCommerce draft product, then reads the saved product in a new WP-CLI process. Services and volumes are destroyed after the test.

The initial workflow run successfully installed WordPress and brought up MariaDB. Its WooCommerce step failed because `wp-content/upgrade` was not writable. A subsequent commit fixes ownership in the ephemeral CI container. Mark WooCommerce PASS **only after a later workflow run succeeds**.

## Local Docker environment (only on systems where Docker runs)
Create a local, untracked `.env` containing strong development-only passwords:

```dotenv
DB_PASSWORD=replace-with-a-long-random-local-password
DB_ROOT_PASSWORD=replace-with-another-long-random-local-password
WP_ADMIN_PASSWORD=replace-with-an-admin-test-password
```

Then run:

```sh
docker compose up -d db wordpress
# WordPress installer: http://127.0.0.1:8080
```

The database is not exposed to the host, and WordPress binds to 127.0.0.1 by default. The website does not run on GitHub Pages. The container environment has not been tested on macOS Catalina and should not be described as installed on that machine.

## Safety
No accounts, external suppliers, real payments, live domains, secret keys or production changes are used in CI. GitHub Actions test passwords are ephemeral and restricted to disposable containers. Do not reuse them in production.
