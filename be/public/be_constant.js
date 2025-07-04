export const htmlContent = ({ FE_BASE, generatedCrypto }) => {
    return (
        `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #7F00FF; /* Warna dasar ungu tua */
            padding: 30px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            padding: 30px;
            text-align: center;
            color: #333333;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 20px;
            font-size: 16px;
        }
        .button-container {
            padding: 0 30px 30px 30px;
            text-align: center;
        }
        .button {
            display: inline-block;
            background-color: #7F00FF; /* Warna tombol ungu tua */
            color: #fff;
            padding: 15px 30px;
            border-radius: 5px;
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #6a00d8; /* Sedikit lebih gelap saat hover */
        }
        .footer {
            background-color: #eeeeee;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #777777;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>HORIZON POS</h1>
            <p>Konfirmasi Pendaftaran Akun</p>
        </div>
        <div class="content">
            <p>Selamat Siang Bapak/Ibu,</p>
            <p>Kami menerima permintaan pembuatan akun di layanan Horizon POS. Jika benar Anda yang melakukan permintaan ini, silakan klik tombol di bawah untuk mengonfirmasi email Anda dan mengaktifkan akun.</p>
            <p>Jika Anda tidak pernah mencoba mendaftar, mohon abaikan email ini. link akan mati dalam waktu 24 jam dan email anda akan dihapus dari sistem kami</p>
        </div>
        <div class="button-container">
    <a href="${FE_BASE}/verify/${generatedCrypto}" target="_blank" class="button">Konfirmasi Pendaftaran</a>
</div>

        <div class="footer">
            <p>&copy; 2025 Horizon Paradigm. Semua hak cipta dilindungi.</p>
            <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
        </div>
    </div>
</body>
</html>
`
    )
}