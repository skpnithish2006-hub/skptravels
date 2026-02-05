/**
 * SKP Travel - Calendar Module
 * Interactive booking calendar with availability display
 * 
 * Features:
 * - Shows available, booked, and selected dates
 * - Syncs with localStorage for confirmed bookings
 * - Disabled dates prevent double-booking
 * 
 * Calendar Legend:
 * - Green: Available (can select)
 * - Red: Booked/Confirmed (disabled)
 * - Blue: Selected (current selection)
 * - Gray: Past dates (disabled)
 */

const Calendar = {
    currentDate: new Date(),
    selectedDate: null,
    bookedDates: ['2026-02-05', '2026-02-10', '2026-02-14', '2026-02-20'], // Default sample booked dates

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (this.container) {
            // Load confirmed booking dates from localStorage
            this.loadBookedDates();
            this.render();
            this.bindEvents();
        }
    },

    /**
     * Load booked dates from localStorage
     * These are dates confirmed by the owner from the dashboard
     */
    loadBookedDates() {
        const stored = localStorage.getItem('skp_booked_dates');
        if (stored) {
            const confirmedDates = JSON.parse(stored);
            // Merge with existing booked dates (avoid duplicates)
            confirmedDates.forEach(date => {
                if (!this.bookedDates.includes(date)) {
                    this.bookedDates.push(date);
                }
            });
        }
    },

    /**
     * Save booked dates to localStorage for cross-page sync
     */
    saveBookedDates() {
        localStorage.setItem('skp_booked_dates', JSON.stringify(this.bookedDates));
    },

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(this.currentDate);

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        let daysHtml = '';

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            daysHtml += '<div class="calendar-day disabled"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const date = new Date(year, month, day);
            const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isToday = date.toDateString() === today.toDateString();
            const isBooked = this.bookedDates.includes(dateStr);
            const isSelected = this.selectedDate === dateStr;

            let classes = 'calendar-day';
            let title = '';

            if (isPast) {
                classes += ' disabled';
                title = 'Past date';
            } else if (isBooked) {
                classes += ' booked';
                title = 'Already booked - not available';
            } else {
                classes += ' available';
                title = 'Available - click to select';
            }

            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';

            daysHtml += `<div class="${classes}" data-date="${dateStr}" title="${title}">${day}</div>`;
        }

        this.container.innerHTML = `
            <div class="calendar-header">
                <h3 class="calendar-title">${monthName}</h3>
                <div class="calendar-nav">
                    <button class="calendar-nav-btn" data-action="prev" aria-label="Previous month">←</button>
                    <button class="calendar-nav-btn" data-action="next" aria-label="Next month">→</button>
                </div>
            </div>
            <div class="calendar-weekdays">
                <div class="calendar-weekday">Sun</div>
                <div class="calendar-weekday">Mon</div>
                <div class="calendar-weekday">Tue</div>
                <div class="calendar-weekday">Wed</div>
                <div class="calendar-weekday">Thu</div>
                <div class="calendar-weekday">Fri</div>
                <div class="calendar-weekday">Sat</div>
            </div>
            <div class="calendar-days">${daysHtml}</div>
            <div class="calendar-legend">
                <div class="legend-item"><span class="legend-dot available"></span> Available</div>
                <div class="legend-item"><span class="legend-dot booked"></span> Booked</div>
                <div class="legend-item"><span class="legend-dot selected"></span> Selected</div>
            </div>
            <div class="calendar-note" style="margin-top: 0.75rem; padding: 0.75rem; background: var(--bg-surface); border-radius: var(--radius-md); font-size: 0.8rem; color: var(--text-secondary);">
                <strong>Note:</strong> Red dates are already confirmed and unavailable. Select a green date for your booking.
            </div>
        `;
    },

    bindEvents() {
        this.container.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="prev"]')) {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.render();
            } else if (e.target.matches('[data-action="next"]')) {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.render();
            } else if (e.target.matches('.calendar-day.available')) {
                this.selectDate(e.target.dataset.date);
            } else if (e.target.matches('.calendar-day.booked')) {
                // Show message for booked dates
                if (window.SKP && SKP.Toast) {
                    SKP.Toast.warning('This date is already booked. Please select another date.');
                }
            }
        });
    },

    selectDate(dateStr) {
        this.selectedDate = dateStr;
        this.render();

        // Update form field if exists
        const dateInput = document.getElementById('travel-date');
        if (dateInput) {
            const date = new Date(dateStr);
            dateInput.value = SKP.Utils.formatShortDate(date);
        }

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('dateSelected', { detail: { date: dateStr } }));
    },

    /**
     * Add a date to the booked list
     * Called when owner confirms a booking
     * 
     * @param {string} dateStr - Date in YYYY-MM-DD format
     */
    addBookedDate(dateStr) {
        if (!this.bookedDates.includes(dateStr)) {
            this.bookedDates.push(dateStr);
            this.saveBookedDates(); // Persist for cross-page sync
            this.render();
        }
    },

    /**
     * Remove a date from the booked list
     * Can be used if a booking is cancelled
     * 
     * @param {string} dateStr - Date in YYYY-MM-DD format
     */
    removeBookedDate(dateStr) {
        this.bookedDates = this.bookedDates.filter(d => d !== dateStr);
        this.saveBookedDates();
        this.render();
    },

    /**
     * Check if a date is booked
     * 
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @returns {boolean}
     */
    isDateBooked(dateStr) {
        return this.bookedDates.includes(dateStr);
    },

    /**
     * Get the currently selected date
     * 
     * @returns {string|null} Date in YYYY-MM-DD format or null
     */
    getSelectedDate() {
        return this.selectedDate;
    },

    /**
     * Clear the selected date
     */
    clearSelection() {
        this.selectedDate = null;
        this.render();
    }
};

// Initialize calendar if container exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('booking-calendar')) {
        Calendar.init('booking-calendar');
    }
});

// Expose Calendar globally
window.Calendar = Calendar;
