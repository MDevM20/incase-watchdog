/**
 * Generates the HTML for the Emergency Access notification email.
 */
export function getEmergencyAccessTemplate(data: {
  ownerName: string;
  fileUrl: string;
  masterKey: string;
  hint: string;
  fileId: string;
}) {
  const { ownerName, fileUrl, masterKey, hint, fileId } = data;
  const primaryColor = "#00FF9D";
  const bgColor = "#0A0E14";
  const cardBg = "#161B22";
  const borderColor = "#30363D";
  const textColor = "#FFFFFF";
  const mutedTextColor = "#94A3B8";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Emergency Access Granted</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: ${bgColor};
            color: ${textColor};
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 650px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .badge {
            display: inline-block;
            background-color: rgba(0, 255, 157, 0.1);
            color: ${primaryColor};
            padding: 4px 12px;
            border-radius: 100px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border: 1px solid rgba(0, 255, 157, 0.3);
            margin-bottom: 24px;
        }
        h1 {
            font-size: 36px;
            line-height: 1.1;
            margin: 0 0 24px 0;
            font-weight: 800;
            letter-spacing: -0.02em;
        }
        .highlight {
            color: ${primaryColor};
        }
        p.description {
            color: ${mutedTextColor};
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 32px 0;
        }
        .card {
            background-color: ${cardBg};
            border: 1px solid ${borderColor};
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
        }
        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }
        .card-title {
            font-size: 18px;
            font-weight: 700;
            margin-left: 8px;
        }
        .card-body p {
            font-size: 14px;
            line-height: 1.5;
            color: ${mutedTextColor};
            margin: 0;
        }
        .btn {
            display: inline-block;
            background-color: ${primaryColor};
            color: #000000;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            margin-top: 16px;
            box-shadow: 0 4px 14px 0 rgba(0, 255, 157, 0.3);
        }
        .key-grid {
            display: flex;
            gap: 20px;
            margin-bottom: 32px;
        }
        .key-box {
            flex: 1;
            background-color: ${cardBg};
            border: 1px solid ${borderColor};
            border-radius: 12px;
            padding: 20px;
            position: relative;
        }
        .key-label {
            font-size: 10px;
            font-weight: 700;
            color: ${primaryColor};
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 12px;
        }
        .key-title {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 16px;
        }
        .key-value-container {
            background-color: #000000;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .key-value {
            font-family: 'SF Mono', 'Fira Code', monospace;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 0.1em;
        }
        .hint-text {
            font-style: italic;
            color: ${mutedTextColor};
            font-size: 14px;
            line-height: 1.5;
        }
        .next-steps-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 20px;
        }
        .step {
            display: flex;
            margin-bottom: 16px;
        }
        .step-num {
            background-color: rgba(255, 255, 255, 0.1);
            color: ${mutedTextColor};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .step-text {
            font-size: 14px;
            line-height: 1.5;
            color: ${mutedTextColor};
        }
        .footer {
            margin-top: 60px;
            text-align: center;
            border-top: 1px solid ${borderColor};
            padding-top: 40px;
        }
        .footer-logo {
            font-size: 20px;
            font-weight: 800;
            color: ${primaryColor};
            margin-bottom: 16px;
        }
        .footer-links {
            margin-bottom: 24px;
        }
        .footer-links a {
            color: ${mutedTextColor};
            text-decoration: none;
            font-size: 12px;
            margin: 0 12px;
        }
        .copyright {
            font-size: 11px;
            color: rgba(148, 163, 184, 0.5);
            margin-bottom: 20px;
        }
        .security-badge {
            display: inline-block;
            background-color: rgba(255, 255, 255, 0.05);
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 9px;
            font-family: monospace;
            color: ${primaryColor};
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        @media only screen and (max-width: 600px) {
            .key-grid {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="badge">! HIGH PRIORITY ALERT</div>
        <h1>Emergency Access Granted for <span class="highlight">${ownerName || "the Client"}</span>'s Vault.</h1>
        <p class="description">This is an automated security protocol notification. The emergency access request initiated has been successfully verified. Access to the digital sanctuary is now authorized.</p>
        
        <div class="card">
            <div class="card-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${primaryColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <div class="card-title">Vault Location</div>
            </div>
            <div class="card-body">
                <p>Download the encrypted container. You will need the access keys below to decrypt its contents.</p>
                <a href="${fileUrl}" class="btn">Download Encrypted Vault PDF</a>
            </div>
        </div>

        <div class="key-grid">
            <div class="key-box">
                <div class="key-label">PART 1 OF 2: MASTER KEY</div>
                <div class="key-value-container">
                    <span class="key-value">${masterKey}</span>
                </div>
                <div class="card-body">
                    <p style="font-size: 12px;">This alphanumeric string is system-generated and unchangeable.</p>
                </div>
                <div style="position: absolute; bottom: 0; left: 0; width: 2px; height: 100%; background-color: ${primaryColor}; border-radius: 2px 0 0 2px;"></div>
            </div>
            <div class="key-box">
                <div class="key-label" style="color: #60A5FA;">PART 2 OF 2: HINT</div>
                <div class="key-title">Hint for Key Part 2</div>
                <div class="hint-text">
                    "${hint || "No hint provided."}"
                </div>
                <p style="font-size: 12px; margin-top: 12px; color: rgba(148, 163, 184, 0.6);">The answer to this hint was set by the vault owner.</p>
                <div style="position: absolute; bottom: 0; left: 0; width: 2px; height: 100%; background-color: #60A5FA; border-radius: 2px 0 0 2px;"></div>
            </div>
        </div>

        <div class="next-steps-title">Next Steps</div>
        <div class="step">
            <div class="step-num">1</div>
            <div class="step-text">Open the downloaded PDF file using any standard PDF viewer or the InCase Secure Desktop app.</div>
        </div>
        <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">When prompted for a password, enter the 12-character Master Key (Part 1) immediately followed by your answer to the hint (Part 2).</div>
        </div>
        <div class="step">
            <div class="step-num">3</div>
            <div class="step-text">Example: If Part 1 is ABCD-123 and your hint answer is Buddy1998, enter <strong>ABCD123Buddy1998</strong>.</div>
        </div>

        <div class="footer">
            <div class="footer-logo">InCase</div>
            <div class="footer-links">
                <a href="#">Security Protocol</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Contact Support</a>
            </div>
            <div class="copyright">© 2024 InCase Digital Trust. This is an automated security notification.</div>
            <div class="security-badge">● NODE_SEC_SECURE</div>
        </div>
    </div>
</body>
</html>
  `;
}
