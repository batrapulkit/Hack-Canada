import 'dotenv/config';
import axios from 'axios';

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'triponic.myshopify.com';
const API_TOKEN = process.env.SHOPIFY_API_SECRET;

const products = [
    { title: 'Luxury Maldives Retreat (7 Days)', price: '3500.00', tags: 'summer, beach, luxury' },
    { title: 'Swiss Alps Ski Adventure (5 Days)', price: '2800.00', tags: 'winter, snow, sports' },
    { title: 'Kyoto Cultural Immersion (10 Days)', price: '4200.00', tags: 'culture, asia, historical' },
    { title: 'Santorini Honeymoon Package (6 Days)', price: '3100.00', tags: 'summer, romance, beach' },
    { title: 'Dubai Desert Safari & City Tour (4 Days)', price: '1500.00', tags: 'desert, luxury, city' },
    { title: 'Banff National Park Explorer (5 Days)', price: '1900.00', tags: 'nature, mountains, winter' },
    { title: 'Paris Getaway (3 Days)', price: '1200.00', tags: 'city, romance, europe' },
    { title: 'Bali Yoga & Wellness Retreat (8 Days)', price: '2100.00', tags: 'wellness, summer, asia' },
    { title: 'New York City Lights Tour (4 Days)', price: '1600.00', tags: 'city, usa, culture' },
    { title: 'London Historical Journey (5 Days)', price: '1800.00', tags: 'city, history, europe' },
];

async function seedProducts() {
    console.log('Seeding 10 travel packages to Shopify...');

    for (const product of products) {
        try {
            const response = await axios({
                url: `https://${STORE_DOMAIN}/admin/api/2024-01/graphql.json`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': API_TOKEN,
                },
                data: {
                    query: `
            mutation productCreate($input: ProductInput!) {
              productCreate(input: $input) {
                product {
                  id
                  title
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `,
                    variables: {
                        input: {
                            title: product.title,
                            status: 'ACTIVE',
                            vendor: 'Triponic',
                            tags: product.tags.split(', '),
                            variants: [
                                {
                                    price: product.price,
                                }
                            ]
                        }
                    }
                }
            });

            const errors = response.data.data.productCreate.userErrors;
            if (errors && errors.length > 0) {
                console.error(`Failed to create ${product.title}:`, errors);
            } else {
                console.log(`✅ Created: ${product.title}`);
            }
        } catch (error) {
            console.error(`Error creating ${product.title}:`, error.message);
        }
    }
    console.log('Done seeding products!');
}

seedProducts();
