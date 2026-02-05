/**
 * SKP Travels - Dashboard Module
 * Admin dashboard for managing van bookings
 * 
 * Features:
 * - Display booking requests with user details
 * - Accept/Reject booking requests
 * - WhatsApp click-to-chat for manual confirmation (NOT automated)
 * - Calendar sync to mark confirmed dates as booked
 * 
 * FUTURE: WhatsApp Cloud API integration for automated messaging
 */

const Dashboard = {
    isAuthenticated: false,
    bookings: [],

    // Owner details
    ownerName: 'S.K.Panneerselvam',
    ownerWhatsApp: '+919843775939',

    init() {
        this.loginModal = document.getElementById('login-modal');
        this.dashboardContent = document.getElementById('dashboard-content');
        this.loginForm = document.getElementById('login-form');

        // Load bookings from localStorage
        this.loadBookings();

        // Load booked dates for calendar sync
        this.loadBookedDates();

        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (sessionStorage.getItem('adminLoggedIn')) {
            this.showDashboard();
        } else {
            this.showLoginModal();
        }
    },

    /**
     * Load bookings from localStorage
     * Bookings are saved by the booking form on submission
     */
    loadBookings() {
        const stored = localStorage.getItem('skp_bookings');
        if (stored) {
            this.bookings = JSON.parse(stored);
        } else {
            this.bookings = [];
        }
    },

    /**
     * Load booked dates for calendar synchronization
     * These are dates that have been confirmed by the owner
     */
    loadBookedDates() {
        const stored = localStorage.getItem('skp_booked_dates');
        if (stored) {
            const dates = JSON.parse(stored);
            // Sync with Calendar module if available
            if (window.Calendar) {
                dates.forEach(date => {
                    if (!Calendar.bookedDates.includes(date)) {
                        Calendar.bookedDates.push(date);
                    }
                });
            }
        }
    },

    /**
     * Save bookings to localStorage
     */
    saveBookings() {
        localStorage.setItem('skp_bookings', JSON.stringify(this.bookings));
    },

    /**
     * Save booked dates for calendar sync across pages
     */
    saveBookedDates() {
        // Get all confirmed booking dates
        const confirmedDates = this.bookings
            .filter(b => b.status === 'confirmed')
            .map(b => b.date)
            .filter(d => d); // Filter out null/undefined dates

        localStorage.setItem('skp_booked_dates', JSON.stringify(confirmedDates));
    },

    showLoginModal() {
        if (this.loginModal) this.loginModal.classList.add('active');
        if (this.dashboardContent) this.dashboardContent.style.display = 'none';
    },

    hideLoginModal() {
        if (this.loginModal) this.loginModal.classList.remove('active');
    },

    handleLogin() {
        const password = document.getElementById('admin-password')?.value;
        if (password === 'admin123') {
            sessionStorage.setItem('adminLoggedIn', 'true');
            this.isAuthenticated = true;
            this.hideLoginModal();
            this.showDashboard();
            SKP.Toast.success('Welcome back!');
        } else {
            SKP.Toast.error('Invalid password');
        }
    },

    logout() {
        sessionStorage.removeItem('adminLoggedIn');
        this.isAuthenticated = false;
        this.showLoginModal();
        SKP.Toast.success('Logged out successfully');
    },

    showDashboard() {
        if (this.dashboardContent) {
            this.dashboardContent.style.display = 'block';
            // Reload bookings to get latest
            this.loadBookings();
            this.updateStats();
            this.renderBookings();
        }
    },

    /**
     * Update dashboard statistics
     */
    updateStats() {
        const total = this.bookings.length;
        const pending = this.bookings.filter(b => b.status === 'pending').length;
        const confirmed = this.bookings.filter(b => b.status === 'confirmed').length;

        const statTotal = document.getElementById('stat-total');
        const statPending = document.getElementById('stat-pending');
        const statConfirmed = document.getElementById('stat-confirmed');

        if (statTotal) statTotal.textContent = total;
        if (statPending) statPending.textContent = pending;
        if (statConfirmed) statConfirmed.textContent = confirmed;
    },

    /**
     * Render bookings table with enhanced columns
     * Shows: Name, Phone, WhatsApp, Location, Date, Status, Actions
     */
    renderBookings() {
        const tbody = document.getElementById('bookings-table');
        if (!tbody) return;

        if (this.bookings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        No booking requests yet. New bookings will appear here.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.bookings.map(b => `
            <tr>
                <td>
                    <strong>${b.name}</strong><br>
                    <small>${b.email || 'No email'}</small>
                </td>
                <td>
                    <a href="tel:${b.phone}">${b.phone}</a>
                </td>
                <td>
                    <a href="https://wa.me/${(b.whatsapp || b.phone).replace(/\D/g, '')}" target="_blank" style="color: #25D366;">
                        ${b.whatsapp || b.phone}
                    </a>
                </td>
                <td>
                    <strong>${b.tripType || 'Trip'}</strong><br>
                    <small>${b.destination || b.route || 'Not specified'}</small><br>
                    <small>👥 ${b.passengers || '?'} passengers</small>
                </td>
                <td>${b.date ? new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}</td>
                <td><span class="status-badge ${b.status}">${this.formatStatus(b.status)}</span></td>
                <td class="action-buttons">
                    ${this.renderActionButtons(b)}
                </td>
            </tr>
        `).join('');
    },

    /**
     * Format status for display
     */
    formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'confirmed': 'Confirmed',
            'rejected': 'Rejected'
        };
        return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
    },

    /**
     * Render action buttons based on booking status
     * - Pending: Accept, Reject buttons
     * - Confirmed: WhatsApp button to send confirmation
     * - Rejected: No actions
     */
    renderActionButtons(booking) {
        if (booking.status === 'pending') {
            return `
                <button class="action-btn accept" onclick="Dashboard.acceptBooking(${booking.id})">
                    ✓ Accept
                </button>
                <button class="action-btn reject" onclick="Dashboard.rejectBooking(${booking.id})">
                    ✕ Reject
                </button>
            `;
        } else if (booking.status === 'confirmed') {
            return `
                <button class="action-btn whatsapp" onclick="Dashboard.sendWhatsAppConfirmation(${booking.id})" style="background: #25D366;">
                    💬 Send WhatsApp
                </button>
                <small style="display: block; margin-top: 0.5rem; color: var(--text-secondary);">
                    (Manual Send)
                </small>
            `;
        } else {
            return '<span style="color: var(--text-secondary);">—</span>';
        }
    },

    /**
     * Accept a booking request
     * - Updates status to 'confirmed'
     * - Marks the date as booked in calendar (red)
     * - Opens WhatsApp with pre-filled confirmation message
     */
    acceptBooking(id) {
        const booking = this.bookings.find(b => b.id === id);
        if (booking) {
            // Update status
            booking.status = 'confirmed';
            this.saveBookings();
            this.saveBookedDates(); // Save for calendar sync
            this.updateStats();
            this.renderBookings();

            // Mark date as booked in calendar (red/disabled)
            if (window.Calendar && booking.date) {
                Calendar.addBookedDate(booking.date);
            }

            SKP.Toast.success(`Booking for ${booking.name} confirmed! Date marked as booked.`);

            // Automatically open WhatsApp with confirmation message
            this.sendWhatsAppConfirmation(id);
        }
    },

    /**
     * Reject a booking request
     * - Updates status to 'rejected'
     * - Does NOT mark the date as booked (remains available)
     */
    rejectBooking(id) {
        const booking = this.bookings.find(b => b.id === id);
        if (booking) {
            booking.status = 'rejected';
            this.saveBookings();
            this.updateStats();
            this.renderBookings();
            SKP.Toast.warning(`Booking for ${booking.name} rejected`);
        }
    },

    /**
     * Send WhatsApp confirmation message (Click-to-Chat)
     * 
     * Opens WhatsApp Web/App with pre-filled message.
     * Owner must manually click send - this is NOT automated.
     * 
     * Message includes:
     * - Confirmation status
     * - Booking details
     * - Owner contact number for queries
     * 
     * FUTURE: Replace with WhatsApp Cloud API for automation:
     * - Use WhatsApp Business API template messages
     * - Send programmatically without manual intervention
     * - Track delivery and read status
     */
    sendWhatsAppConfirmation(id) {
        const booking = this.bookings.find(b => b.id === id);
        if (!booking) return;

        // Get user's WhatsApp number (remove non-digits for wa.me link)
        const whatsappNumber = (booking.whatsapp || booking.phone).replace(/\D/g, '');

        // Format date for display
        const formattedDate = booking.date
            ? new Date(booking.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            })
            : 'your selected date';

        // Pre-filled confirmation message
        // This matches the requirement: "✅ Your travel date is confirmed with SKP Travel. For queries contact +91XXXXXXXXXX."
        const message = `✅ Your travel date is confirmed with SKP Travel!

📅 Date: ${formattedDate}
🛣️ Route: ${booking.destination || booking.route || 'As discussed'}
👥 Passengers: ${booking.passengers || '—'}

Thank you for booking with us, ${booking.name}! 🙏

For any queries, contact:
👤 ${this.ownerName}
📞 ${this.ownerWhatsApp}

🚐 SKP Travels - Your Journey, Our Van`;

        /**
         * FUTURE ENHANCEMENT: WhatsApp Cloud API Integration
         * 
         * Replace the click-to-chat with API call:
         * 
         * await whatsappBusinessAPI.sendMessage({
         *   to: whatsappNumber,
         *   type: 'template',
         *   template: {
         *     name: 'booking_confirmed',
         *     language: { code: 'en' },
         *     components: [
         *       { type: 'body', parameters: [
         *         { type: 'text', text: booking.name },
         *         { type: 'text', text: formattedDate },
         *         { type: 'text', text: booking.destination }
         *       ]}
         *     ]
         *   }
         * });
         * 
         * This would send the message automatically without manual intervention
         */

        // Open WhatsApp click-to-chat (manual send required)
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        SKP.Toast.success('WhatsApp opened with confirmation message. Please click Send.');
    },

    /**
     * Legacy method - kept for backwards compatibility
     * @deprecated Use acceptBooking/rejectBooking instead
     */
    updateStatus(id, status) {
        if (status === 'confirmed') {
            this.acceptBooking(id);
        } else if (status === 'rejected') {
            this.rejectBooking(id);
        }
    },

    /**
     * Legacy contact method - replaced by sendWhatsAppConfirmation
     * @deprecated Use sendWhatsAppConfirmation instead
     */
    contactCustomer(id) {
        this.sendWhatsAppConfirmation(id);
    },

    /**
     * Add new booking (can be called from booking page if needed)
     */
    addBooking(data) {
        const newBooking = {
            id: Date.now(),
            ...data,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        this.bookings.unshift(newBooking);
        this.saveBookings();
        this.updateStats();
        this.renderBookings();
        return newBooking;
    },

    /**
     * Delete a booking
     */
    deleteBooking(id) {
        this.bookings = this.bookings.filter(b => b.id !== id);
        this.saveBookings();
        this.saveBookedDates(); // Update booked dates
        this.updateStats();
        this.renderBookings();
        SKP.Toast.success('Booking deleted');
    }
};

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboard-content') || document.getElementById('login-modal')) {
        Dashboard.init();
    }
});

// Expose Dashboard globally
window.Dashboard = Dashboard;
