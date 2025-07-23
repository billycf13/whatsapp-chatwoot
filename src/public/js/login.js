/**
 * Fungsi untuk menampilkan notifikasi toast
 * @param {string} message - Pesan yang akan ditampilkan
 * @param {string} type - Tipe notifikasi (info, success, error, warning)
 */
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <button class="toast-close">&times;</button>
        </div>
        <div class="toast-message">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Tampilkan toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hapus toast setelah 5 detik
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 5000);
    
    // Tutup toast saat tombol close diklik
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    });
}

/**
 * Fungsi untuk memvalidasi kredensial login
 * @param {string} username - Username yang dimasukkan
 * @param {string} password - Password yang dimasukkan
 * @returns {boolean} - Hasil validasi (true jika valid, false jika tidak)
 */
function validateCredentials(username, password) {
    // Kredensial yang valid
    const validUsername = 'admin';
    const validPassword = 'P@$$W0RD';
    
    // Memeriksa apakah username dan password sesuai
    return username === validUsername && password === validPassword;
}

/**
 * Fungsi untuk menyimpan status login ke localStorage
 * @param {string} username - Username yang berhasil login
 */
function saveLoginState(username) {
    const loginData = {
        username: username,
        isLoggedIn: true,
        loginTime: new Date().getTime(),
        // Opsional: tambahkan waktu kedaluwarsa (misal 24 jam)
        expiresAt: new Date().getTime() + (24 * 60 * 60 * 1000)
    };
    
    localStorage.setItem('authData', JSON.stringify(loginData));
}

/**
 * Event listener untuk form login
 * Menangani validasi dan proses login
 */
document.addEventListener('DOMContentLoaded', function() {
    // Cek jika pengguna sudah login, redirect ke index.html
    const authData = JSON.parse(localStorage.getItem('authData') || '{}');
    if (authData.isLoggedIn && authData.expiresAt > new Date().getTime()) {
        window.location.href = 'index.html';
        return;
    }
    
    const loginForm = document.querySelector('.login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Validasi field kosong
            if (!username || !password) {
                showToast('Harap isi semua field yang diperlukan', 'error');
                return;
            }
            
            // Validasi kredensial
            if (validateCredentials(username, password)) {
                // Simpan status login
                saveLoginState(username);
                
                // Login berhasil
                showToast('Login berhasil! Mengalihkan...', 'success');
                
                // Redirect ke halaman dashboard setelah login berhasil
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                // Login gagal
                showToast('Username atau password salah', 'error');
            }
        });
    }
});