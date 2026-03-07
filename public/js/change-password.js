const token = localStorage.getItem('token');

if (!token) {
    window.location.href = '/login';
}

document.getElementById('change-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('current').value;
    const newPassword = document.getElementById('new').value;

    const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
        alert(data.error);
        return;
    }

    alert("Contraseña actualizada");
    window.location.href = '/dashboard';
});