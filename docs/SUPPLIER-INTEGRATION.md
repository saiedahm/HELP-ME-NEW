# HELP-ME supplier catalog setup

The storefront reads real products from `GET /api/catalog`. It intentionally does not publish sample products or charge customers while supplier data is unavailable.

## Environment variables

Set these as server-side secrets in the deployment environment (never in client-side code):

- `CJ_API_KEY`: API key from the CJdropshipping developer/API authorization page. The server obtains and keeps the CJ access token server-side.
- `BRANDSGATEWAY_CATALOG_URL`: the exact REST/JSON catalog endpoint supplied by BrandsGateway for the account.
- `BRANDSGATEWAY_API_TOKEN`: the API token supplied by BrandsGateway for that endpoint.
- `BRANDSGATEWAY_CURRENCY=EUR`: set only after confirming that the configured BrandsGateway endpoint returns product costs in euros. Products with unconfirmed currency are excluded.

The BrandsGateway endpoint and token format must match the credentials and API contract issued for the actual account. Do not guess a URL or place the secret in the browser.

## Behavior

- `GET /api/catalog` fetches products from configured suppliers and returns up to 1,000 normalized entries.
- Products missing a supplier identifier, name, image URL, or positive price are excluded.
- The current default markup is 40%; verify supplier cost fields and shipping/tax treatment before commercial use.
- `GET /api/suppliers/status` reports whether required environment variables are present; it never returns their values.
- The storefront remains blank while no valid real supplier products are available.

## Still required before live sales

1. Add the actual credentials/endpoints for both supplier accounts.
2. Test real product variants, EUR price conversion, stock refresh, shipping costs, and discontinued products.
3. Implement and test supplier order creation and order-status synchronization. Catalog import alone does not fulfill orders.
4. Configure a real one-time store checkout and signed payment webhook only after the fulfillment flow is tested in payment test mode.
5. Enable live payments and automatic payouts only after the merchant account, legal business details, bank account, and provider verification are complete.

Never commit API keys, Stripe secrets, webhook secrets, or bank details to this repository.
