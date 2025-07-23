/**
 * Fungsi untuk memeriksa status login pengguna
 * @returns {boolean} - Status login (true jika sudah login, false jika belum)
 */
function isLoggedIn() {
    const authData = JSON.parse(localStorage.getItem('authData') || '{}');
    
    // Periksa apakah pengguna sudah login dan sesi belum kedaluwarsa
    if (authData.isLoggedIn && authData.expiresAt > new Date().getTime()) {
        return true;
    }
    
    return false;
}

/**
 * Fungsi untuk logout
 */
function logout() {
    localStorage.removeItem('authData');
    window.location.href = 'login.html';
}

/**
 * Fungsi untuk mendapatkan data pengguna yang sedang login
 * @returns {object|null} - Data pengguna atau null jika tidak ada
 */
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    const authData = JSON.parse(localStorage.getItem('authData'));
    return {
        username: authData.username,
        loginTime: authData.loginTime
    };
}

/**
 * Fungsi untuk memproteksi halaman
 * Redirect ke halaman login jika pengguna belum login
 */
function protectPage() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// Jalankan proteksi halaman saat dokumen dimuat
document.addEventListener('DOMContentLoaded', function() {
    // Jika halaman bukan login.html, proteksi halaman
    if (!window.location.pathname.includes('login.html')) {
        protectPage();
    }
});