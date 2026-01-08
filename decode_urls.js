const atob = require('buffer').atob || ((str) => Buffer.from(str, 'base64').toString('binary'));

const url1 = "eyJpbWFnZV91cmwiOiJodHRwczpcL1wvY2RuLmNzZ29za2lucy5nZ1wvcHVibGljXC91aWhcL2NvbGxlY3Rpb25zXC9hSFIwY0hNNkx5OWpaRzR1WTNObmIzTnJhVzV6TG1kbkwzQjFZbXhwWXk5cGJXRm5aWE12WTI5c2JHVmpkR2x2Ym5Ndk9HVmpNakkxWTJSbE5qazVOR1V5TW1ZNVlXSXlNbVV3TnpKa00yUmlaRFF2WkdWbVlYVnNkQzV3Ym1jLVwvYXV0b1wvYXV0b1wvODVcL25vdHJpbVwvOWRhNDEzZDk0NDVjZTZjYTQwYTdiMWU0NWMyZTA3MWMucG5nIiwiYXNwZWN0X3JhdGlvIjoxLjMzMzMzMzMzMzMzMzMzMzMsInNpZyI6IjQ4ZDNlNDI5ZWEwYjUwMjJkOWVjNTBhZjYzYzQyZjE3In0-";
const url2 = "eyJpbWFnZV91cmwiOiJodHRwczpcL1wvY2RuLmNzZ29za2lucy5nZ1wvcHVibGljXC91aWhcL2NvbGxlY3Rpb25zXC9hSFIwY0hNNkx5OWpaRzR1WTNObmIzTnJhVzV6TG1kbkwzQjFZbXhwWXk5cGJXRm5aWE12WTI5c2JHVmpkR2x2Ym5NdkpERXlZVEV4T0RsaU9EWTJaR00wTXpoak1UVmhPV00xTmpZMlltWm1Oamd2WkdWbVlYVnNkQzV3Ym1jLVwvYXV0b1wvYXV0b1wvODVcL25vdHJpbVwvYzk3YzBhYWU4YzAxZmJhNDI1MGE3ODY0NmUyZDEwNzMucG5nIiwiYXNwZWN0X3JhdGlvIjoxLjMzMzMzMzMzMzMzMzMzMzMsInNpZyI6IjlhM2M4OTIxNmRjNGQxMzUyMDU0YTgzNzg4YTgwODMwIn0-";

// Need to fix base64 string if it has URL safe chars
// Replace - with +, _ with /
function decode(str) {
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) {
        b64 += '=';
    }
    const json = Buffer.from(b64, 'base64').toString('utf8');
    try {
        const obj = JSON.parse(json);
        console.log("Decoded:", obj.image_url.replace(/\\\//g, '/'));
    } catch (e) {
        console.log("Error parsing JSON:", e.message);
        console.log("Raw:", json);
    }
}

console.log("Decoding URL 1 (Graphic Design?):");
decode(url1);

console.log("\nDecoding URL 2 (Overpass 2024?):");
decode(url2);
