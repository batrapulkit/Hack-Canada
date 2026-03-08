/**
 * Generates a beautiful HTML email template.
 * @param {string} content - The main body content of the email.
 * @param {string} subject - The subject of the email.
 * @returns {string} - The complete HTML string.
 */
export const getMassEmailTemplate = (content, subject) => {
    // Using a reliable placeholder for the logo if not provided. 
    // In a real scenario, this should be a public URL to the company logo.
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f4f4f7;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            margin-top: 40px;
            margin-bottom: 40px;
        }
        .content {
            padding: 40px 30px;
            color: #525f7f;
            line-height: 1.6;
            font-size: 16px;
        }
        .content h1 {
            color: #333333;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            margin-top: 0;
        }
        .content p {
            margin-bottom: 20px;
        }
        .footer {
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            color: #8898aa;
            font-size: 12px;
            border-top: 1px solid #edf2f7;
        }
        .footer a {
            color: #556cd6;
            text-decoration: none;
        }
        @media only screen and (max-width: 620px) {
            .container {
                margin-top: 20px;
                margin-bottom: 20px;
                width: 100%;
                border-radius: 0;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Triponic B2B. All rights reserved.</p>
            <p>
                <a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a>
            </p>
        </div>
    </div>
</body>
</html>
    `;
};
