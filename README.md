# Oyannnz-Money

Oyannnz-Money adalah website sederhana untuk mencatat pemasukan dan pengeluaran. Project ini dibuat dengan HTML, CSS, dan JavaScript, jadi tidak perlu install framework atau menjalankan server khusus untuk mencoba tampilannya.

## Fitur

- Login dan daftar akun demo di browser.
- Masuk sebagai tamu untuk mencoba aplikasi.
- Ringkasan saldo, pemasukan, dan pengeluaran.
- Kantong bawaan: Makan, Kebutuhan, Tabungan, dan Saham.
- Bisa menambah kantong sendiri.
- Form transaksi dengan format angka Rupiah.
- Riwayat transaksi dengan pencarian dan filter.
- Hapus satu transaksi atau seluruh riwayat dengan konfirmasi.
- Data tersimpan di browser menggunakan `localStorage`.
- Tampilan menyesuaikan layar komputer dan ponsel.

## Struktur folder

```text
Oyannnz-Money/
├── index.html   # Struktur halaman
├── styles.css   # Warna, layout, dan tampilan responsif
├── app.js       # Interaksi dan perhitungan transaksi
├── README.md    # Petunjuk project
└── .nojekyll    # File kecil untuk GitHub Pages
```

## Cara mencoba di komputer

1. Download ZIP project ini dari chat, lalu ekstrak.
2. Buka folder hasil ekstrak.
3. Klik dua kali `index.html`.
4. Website akan terbuka di browser.
5. Pilih **Mode Tamu** untuk mencoba, atau buat akun demo baru.

Tidak perlu menjalankan `npm install` karena project ini tidak memakai Node.js atau framework.

## Cara upload ke GitHub

1. Buka https://github.com dan masuk ke akun GitHub.
2. Klik tombol **+** di bagian kanan atas, lalu pilih **New repository**.
3. Isi nama repository dengan `Oyannnz-Money`.
4. Pilih **Public** jika ingin kode bisa dilihat orang lain.
5. Klik **Create repository**.
6. Di halaman repository baru, klik **Add file → Upload files**.
7. Ekstrak ZIP project di komputer. Pilih dan upload file `index.html`, `styles.css`, `app.js`, `README.md`, dan `.nojekyll` ke repository. Pastikan `index.html` berada langsung di halaman utama repository, bukan di dalam folder tambahan.
8. Isi pesan commit, misalnya `Tambah file awal Oyannnz-Money`, lalu klik **Commit changes**.

## Cara menerbitkan website dengan GitHub Pages

1. Buka repository `Oyannnz-Money` di GitHub.
2. Masuk ke **Settings**.
3. Pada menu kiri, buka **Pages**.
4. Di bagian **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/(root)`.
6. Klik **Save**.
7. Tunggu beberapa menit. Muat ulang halaman **Settings → Pages** jika tautan belum muncul.
8. Buka alamat yang ditampilkan GitHub. Biasanya formatnya `https://USERNAME.github.io/Oyannnz-Money/` dengan `USERNAME` diganti nama akun GitHub kamu.

Setelah mengubah kode, upload perubahan dan klik **Commit changes**. GitHub Pages akan menerbitkan versi baru secara otomatis setelah proses deployment selesai.

## Penjelasan singkat kode

- `index.html` berisi elemen halaman, seperti formulir login, dashboard, daftar kantong, dan modal transaksi.
- `styles.css` mengatur warna, jarak, kartu, tombol, dan tampilan pada ukuran layar berbeda.
- `app.js` menangani login demo, pencatatan transaksi, hitung saldo, filter, dan penyimpanan data di browser.
- Fungsi `money()` memformat angka menjadi Rupiah.
- Fungsi `saveDB()` dan `loadDB()` menyimpan serta membaca data dari `localStorage`.
- Fungsi `renderSummary()` dan `renderTransactions()` memperbarui bagian dashboard ketika data berubah.

## Catatan penting sebelum digunakan sungguhan

- Login dan daftar akun di project ini hanya simulasi lokal. Password disimpan di browser dan **tidak aman untuk akun sungguhan**.
- Tombol Google hanya tampilan; login Google belum dihubungkan ke layanan Google.
- Data `localStorage` hanya ada di browser/perangkat yang digunakan. Data tidak otomatis tersinkron ke perangkat lain.
- Jangan gunakan project demo ini untuk menyimpan informasi keuangan yang sensitif. Untuk penggunaan sungguhan, dibutuhkan backend, autentikasi yang aman, dan penyimpanan data yang terlindungi.

## Teknologi

- HTML
- CSS
- JavaScript
- Browser `localStorage`
