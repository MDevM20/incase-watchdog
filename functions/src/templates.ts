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
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Emergency Access Granted</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding: 40px 10px;">
                <!-- Main Container Table -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; text-align: left;">
                    
                    <!-- Alert Badge -->
                    <tr>
                        <td style="padding-bottom: 24px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background-color: rgba(0, 255, 157, 0.1); border: 1px solid rgba(0, 255, 157, 0.3); border-radius: 100px; padding: 4px 12px; color: ${primaryColor}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                                        ! HIGH PRIORITY ALERT
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Headline -->
                    <tr>
                        <td style="padding-bottom: 24px; color: ${textColor}; font-size: 32px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em;">
                            Emergency Access Granted for <span style="color: ${primaryColor};">${ownerName || "the Client"}</span>'s Vault.
                        </td>
                    </tr>

                    <!-- Description -->
                    <tr>
                        <td style="padding-bottom: 32px; color: ${mutedTextColor}; font-size: 16px; line-height: 1.6;">
                            This is an automated security protocol notification. The emergency access request initiated has been successfully verified. Access to the digital sanctuary is now authorized.
                        </td>
                    </tr>

                    <!-- Vault Location Card -->
                    <tr>
                        <td style="padding-bottom: 24px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${cardBg}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 24px;">
                                <tr>
                                    <td style="padding-bottom: 12px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td width="24" valign="top">
                                                    <img src="https://img.icons8.com/ios-filled/24/${primaryColor.replace('#', '')}/lock.png" width="20" height="20" style="display: block;" />
                                                </td>
                                                <td style="padding-left: 8px; color: ${textColor}; font-size: 18px; font-weight: 700;">
                                                    Vault Location
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 16px; color: ${mutedTextColor}; font-size: 14px; line-height: 1.5;">
                                        Download the encrypted container. You will need the access keys below to decrypt its contents.
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <a href="${fileUrl}" style="display: inline-block; background-color: ${primaryColor}; color: #000000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
                                            Download Encrypted Vault PDF
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Keys Section -->
                    <tr>
                        <td style="padding-bottom: 32px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <!-- Key 1 -->
                                    <td valign="top" style="padding-bottom: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${cardBg}; border: 1px solid ${borderColor}; border-left: 4px solid ${primaryColor}; border-radius: 8px; padding: 20px;">
                                            <tr>
                                                <td style="color: ${primaryColor}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding-bottom: 12px;">
                                                    PART 1 OF 2: MASTER KEY
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding-bottom: 12px;">
                                                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000; border-radius: 6px; padding: 16px;">
                                                        <tr>
                                                            <td style="color: ${textColor}; font-family: 'Courier New', Courier, monospace; font-size: 16px; font-weight: 700; word-break: break-all; text-align: center;">
                                                                ${masterKey}
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: ${mutedTextColor}; font-size: 12px; line-height: 1.4;">
                                                    This alphanumeric string is system-generated and unchangeable.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <!-- Key 2 -->
                                    <td valign="top">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${cardBg}; border: 1px solid ${borderColor}; border-left: 4px solid #60A5FA; border-radius: 8px; padding: 20px;">
                                            <tr>
                                                <td style="color: #60A5FA; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding-bottom: 12px;">
                                                    PART 2 OF 2: HINT
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: ${textColor}; font-size: 16px; font-weight: 700; padding-bottom: 8px;">
                                                    Hint for Key Part 2
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: ${mutedTextColor}; font-size: 14px; font-style: italic; line-height: 1.5; padding-bottom: 12px;">
                                                    "${hint || "No hint provided."}"
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: rgba(148, 163, 184, 0.6); font-size: 12px; line-height: 1.4;">
                                                    The answer to this hint was set by the vault owner.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Next Steps -->
                    <tr>
                        <td style="padding-bottom: 20px; color: ${textColor}; font-size: 20px; font-weight: 700;">
                            Next Steps
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-bottom: 32px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <!-- Step 1 -->
                                <tr>
                                    <td width="30" valign="top" style="padding-bottom: 16px;">
                                        <div style="background-color: rgba(255, 255, 255, 0.1); color: ${mutedTextColor}; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700;">1</div>
                                    </td>
                                    <td style="padding-bottom: 16px; padding-left: 12px; color: ${mutedTextColor}; font-size: 14px; line-height: 1.5;">
                                        Open the downloaded PDF file using any standard PDF viewer or the InCase Secure Desktop app.
                                    </td>
                                </tr>
                                <!-- Step 2 -->
                                <tr>
                                    <td width="30" valign="top" style="padding-bottom: 16px;">
                                        <div style="background-color: rgba(255, 255, 255, 0.1); color: ${mutedTextColor}; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700;">2</div>
                                    </td>
                                    <td style="padding-bottom: 16px; padding-left: 12px; color: ${mutedTextColor}; font-size: 14px; line-height: 1.5;">
                                        When prompted for a password, enter the 12-character Master Key (Part 1) immediately followed by your answer to the hint (Part 2).
                                    </td>
                                </tr>
                                <!-- Step 3 -->
                                <tr>
                                    <td width="30" valign="top" style="padding-bottom: 16px;">
                                        <div style="background-color: rgba(255, 255, 255, 0.1); color: ${mutedTextColor}; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 700;">3</div>
                                    </td>
                                    <td style="padding-bottom: 16px; padding-left: 12px; color: ${mutedTextColor}; font-size: 14px; line-height: 1.5;">
                                        Example: If Part 1 is ABCD-123 and your hint answer is Buddy1998, enter <strong style="color: ${textColor};">ABCD123Buddy1998</strong>.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="border-top: 1px solid ${borderColor}; padding-top: 40px; text-align: center;">
                            <div style="color: ${primaryColor}; font-size: 20px; font-weight: 800; padding-bottom: 16px;">InCase</div>
                            <div style="padding-bottom: 24px;">
                                <a href="#" style="color: ${mutedTextColor}; text-decoration: none; font-size: 12px; padding: 0 12px;">Security Protocol</a>
                                <a href="#" style="color: ${mutedTextColor}; text-decoration: none; font-size: 12px; padding: 0 12px;">Privacy Policy</a>
                                <a href="#" style="color: ${mutedTextColor}; text-decoration: none; font-size: 12px; padding: 0 12px;">Contact Support</a>
                            </div>
                            <div style="color: rgba(148, 163, 184, 0.5); font-size: 11px; padding-bottom: 20px;">
                                © 2024 InCase Digital Trust. This is an automated security notification.
                            </div>
                            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 4px; padding: 4px 10px; color: ${primaryColor}; font-family: monospace; font-size: 9px;">
                                ● NODE_SEC_SECURE
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

