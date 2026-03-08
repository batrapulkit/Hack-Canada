import { viatorService } from './src/services/viator.js';

async function test() {
    console.log("Testing Viator API...");
    // Try to search for "Paris" activities or similar
    // Note: We need a valid destinationId for filtering, OR use text search if available?
    // According to docs, /products/search needs strict filters.
    // Let's try a known destination ID for Paris: 479

    const result = await viatorService.searchProducts({
        filtering: {
            destination: "479"
        }
    });

    if (result) {
        console.log("Success! Found products:", result.products ? result.products.length : result);
    } else {
        console.log("Failed.");
    }
}

test();
