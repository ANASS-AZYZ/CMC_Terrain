<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CMC SportBooking - Verification</title>
</head>
<body style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#13243a;">
@php
    $embeddedLogo = (isset($message) && file_exists(public_path('image.png')))
        ? $message->embed(public_path('image.png'))
        : $logoUrl;
@endphp
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb;padding:24px 12px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #d9e3ef;">
                <tr>
                    <td style="padding:22px 28px 14px 28px;text-align:center;background:#ffffff;border-bottom:1px solid #e6edf7;">
                        <img src="{{ $embeddedLogo }}" alt="OFPPT et CMC" style="max-width:280px;width:100%;height:auto;display:block;margin:0 auto 6px auto;">
                    </td>
                </tr>
                <tr>
                    <td style="padding:26px 28px 8px 28px;">
                        <h1 style="margin:0 0 10px 0;font-size:24px;line-height:1.25;color:#0f2741;">Verification du code</h1>
                        <p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;color:#35506e;">
                            Utilisez ce code pour reinitialiser votre mot de passe CMC SportBooking.
                        </p>
                        <p style="margin:0 0 8px 0;font-size:19px;line-height:1.5;color:#0f2741;font-weight:700;">
                            Code verification est : <span style="letter-spacing:3px;color:#0077cc;">{{ $code }}</span>
                        </p>
                        <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#5c6f85;">
                            Ce code expire dans 15 minutes.
                        </p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:0 28px 24px 28px;">
                        <p style="margin:0;font-size:13px;line-height:1.6;color:#7b8ea5;">
                            Si vous n'avez pas demande cette action, ignorez simplement cet email.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
