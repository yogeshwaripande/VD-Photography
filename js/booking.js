const API_URL = 'http://localhost:5000/api/bookings';

// --- STATE MANAGEMENT ---
let bookings = [];
let viewMode = 'list'; 
let currentDate = new Date().toISOString().split('T')[0];
let assistants = []; // Store assistants list locally
let currentPaymentHistory = []; // Store payment history locally for editing

// --- DOM ELEMENTS ---
const elements = {
    stats: {
        total: document.getElementById('statTotal'),
        pending: document.getElementById('statPending'),
        confirmed: document.getElementById('statConfirmed'),
        completed: document.getElementById('statCompleted'),
        revenue: document.getElementById('statRevenue'),
        advance: document.getElementById('statAdvance')
    },
    containers: {
        list: document.getElementById('listViewContainer'),
        calendar: document.getElementById('calendarViewContainer')
    },
    buttons: {
        toggleView: document.getElementById('toggleViewBtn'),
        newBooking: document.getElementById('newBookingBtn'),
        clearFilters: document.getElementById('clearFiltersBtn')
    },
    inputs: {
        calendarDate: document.getElementById('calendarDateInput'),
        filters: document.querySelectorAll('.filters-form input, .filters-form select')
    },
    modal: {
        el: document.getElementById('bookingModal'),
        form: document.getElementById('bookingForm'),
        title: document.getElementById('modalTitle'),
        closeBtns: document.querySelectorAll('.close-modal, .close-modal-btn')
    },
    viewModal: {
        el: document.getElementById('viewModal'),
        body: document.getElementById('viewDetailsBody'),
        closeBtn: document.querySelector('.close-view-modal')
    },
    template: document.getElementById('bookingCardTemplate')
};

// --- INITIALIZATION ---
function init() {
    fetchBookings();
    setupEventListeners();
    initFormElements();
}

async function fetchBookings() {
    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        if (result.success) {
            bookings = result.data;
            renderStats();
            renderView();
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
        elements.containers.list.innerHTML = '<div style="text-align:center; padding:40px; color:red;">Error connecting to server. Please check backend.</div>';
    }
}

// --- RENDER STATS ---
function renderStats() {
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const revenue = bookings.reduce((sum, b) => sum + Number(b.estimatedCost || 0), 0);
    const advance = bookings.reduce((sum, b) => sum + Number(b.advancePaid || 0), 0);

    elements.stats.total.textContent = total;
    elements.stats.pending.textContent = pending;
    elements.stats.confirmed.textContent = confirmed;
    elements.stats.completed.textContent = completed;
    elements.stats.revenue.textContent = '₹' + revenue.toLocaleString();
    elements.stats.advance.textContent = '₹' + advance.toLocaleString();
}

function getFilteredData() {
    const fCustomer = document.getElementById('filterCustomer').value.toLowerCase();
    const fPhoto = document.getElementById('filterPhotographer').value.toLowerCase();
    const fStatus = document.getElementById('filterStatus').value;
    const fDateFrom = document.getElementById('filterDateFrom').value;
    const fDateTo = document.getElementById('filterDateTo').value;
    
    return bookings.filter(b => {
        const matchCust = b.customerName.toLowerCase().includes(fCustomer);
        const matchPhoto = b.photographerName.toLowerCase().includes(fPhoto);
        const matchStatus = fStatus === '' || b.status === fStatus;
        const bookingDate = b.date || '';
        const matchFrom = !fDateFrom || bookingDate >= fDateFrom;
        const matchTo = !fDateTo || bookingDate <= fDateTo;
        return matchCust && matchPhoto && matchStatus && matchFrom && matchTo;
    });
}

function renderView() {
    if (viewMode === 'list') {
        elements.containers.list.classList.remove('hidden');
        elements.containers.calendar.classList.add('hidden');
        renderList();
        elements.containers.list.classList.remove('view-fade-in');
        requestAnimationFrame(() => elements.containers.list.classList.add('view-fade-in'));
    } else {
        elements.containers.list.classList.add('hidden');
        elements.containers.calendar.classList.remove('hidden');
        renderCalendar();
        elements.containers.list.classList.remove('view-fade-in');
    }
}

// --- LIST RENDERING ---
function renderList() {
    const container = elements.containers.list;
    container.innerHTML = ''; 
    const data = getFilteredData();

    if (data.length === 0) {
        const empty = document.createElement('div');
        empty.style.textAlign = 'center';
        empty.style.padding = '40px';
        empty.style.color = '#888';
        empty.textContent = 'No bookings found.';
        container.appendChild(empty);
        return;
    }

    data.forEach((booking, index) => {
        const clone = elements.template.content.cloneNode(true);
        const id = booking._id;
        const cardEl = clone.querySelector('.booking-card');
        const headerEl = clone.querySelector('.card-header');
        
        clone.querySelector('.t-booking-no').textContent = booking.bookingNo;
        clone.querySelector('.t-status').textContent = booking.status;
        clone.querySelector('.t-status').classList.add('status-' + booking.status);
        clone.querySelector('.t-customer-sub').textContent = `${booking.customerId} | ${booking.customerName}`;
        clone.querySelector('.t-cost').textContent = '₹' + Number(booking.estimatedCost).toLocaleString();
        clone.querySelector('.t-advance').textContent = 'Adv: ₹' + Number(booking.advancePaid).toLocaleString();
        
        clone.querySelector('.t-photographer').textContent = booking.photographerName;
        clone.querySelector('.t-assistants').textContent = booking.assistants ? `+ ${booking.assistants}` : '';
        clone.querySelector('.t-date').textContent = booking.date;
        clone.querySelector('.t-time').textContent = `${booking.startTime} - ${booking.endTime}`;
        clone.querySelector('.t-type').textContent = booking.eventType;
        clone.querySelector('.t-location').textContent = booking.location;

        clone.querySelector('.btn-view').onclick = () => viewBooking(id);
        clone.querySelector('.btn-edit').onclick = () => openModal(id);
        clone.querySelector('.btn-delete').onclick = () => deleteBooking(id);

        // Keep details collapsed by default; expand/collapse by clicking black header.
        cardEl.classList.add('is-collapsed');
        cardEl.classList.add('card-reveal');
        cardEl.style.setProperty('--reveal-delay', `${Math.min(index, 9) * 55}ms`);
        if (headerEl) {
            headerEl.setAttribute('role', 'button');
            headerEl.setAttribute('tabindex', '0');
            let clickTimer = null;
            const toggleCard = () => {
                const shouldOpen = cardEl.classList.contains('is-collapsed');
                if (shouldOpen) {
                    container.querySelectorAll('.booking-card').forEach(card => {
                        if (card !== cardEl) card.classList.add('is-collapsed');
                    });
                }
                cardEl.classList.toggle('is-collapsed');
            };

            headerEl.addEventListener('click', () => {
                if (clickTimer) clearTimeout(clickTimer);
                clickTimer = setTimeout(() => {
                    toggleCard();
                    clickTimer = null;
                }, 220);
            });

            headerEl.addEventListener('dblclick', (e) => {
                e.preventDefault();
                if (clickTimer) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                }
                viewBooking(id);
            });

            headerEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCard();
                }
            });
        }

        container.appendChild(clone);
    });
}

// --- CALENDAR RENDERING ---
function renderCalendar() {
    elements.inputs.calendarDate.value = currentDate;
    const dayContainer = document.getElementById('calendarDayList');
    const mainGrid = document.getElementById('calendarMainGrid');
    
    dayContainer.innerHTML = '';
    mainGrid.innerHTML = '';

    const data = getFilteredData();
    const todayData = data.filter(b => b.date === currentDate);
    const photographers = [...new Set(bookings.map(b => b.photographerName))];

    if (todayData.length === 0) {
        dayContainer.innerHTML = '<div class="calendar-empty">No bookings for selected date.</div>';
    }
    
    todayData.forEach(b => {
        const div = document.createElement('div');
        div.className = 'mini-event';
        div.innerHTML = `
            <div class="event-time">${b.startTime}</div>
            <div class="event-title">${b.eventType}</div>
            <div class="event-meta">${b.customerName}</div>
        `;
        const id = b._id;
        div.onclick = () => viewBooking(id);
        dayContainer.appendChild(div);
    });

    photographers.forEach(p => {
        const pBookings = data.filter(b => b.photographerName === p);
        const group = document.createElement('div');
        group.className = 'schedule-group';
        
        let eventsHtml = '';
        pBookings.forEach(b => {
            const id = b._id;
            eventsHtml += `
                <div class="mini-event" onclick="viewBooking('${id}')">
                    <div class="event-time">${b.date}</div>
                    <div class="event-title">${b.eventType}</div>
                    <div class="event-meta">${b.startTime} - ${b.endTime}</div>
                </div>
            `;
        });

        group.innerHTML = `
            <div class="schedule-title"><i class="fa-solid fa-camera"></i> ${p}</div>
            <div class="schedule-events">${eventsHtml || '<div class="calendar-empty">No assigned bookings.</div>'}</div>
        `;
        mainGrid.appendChild(group);
    });
}

// --- FORM & MODAL ---
function closeBookingModal() {
    elements.modal.el.classList.remove('active');
    elements.modal.form.scrollTop = 0;
}

function closeViewModal() {
    elements.viewModal.el.classList.remove('active');
    elements.viewModal.el.scrollTop = 0;
}

function openModal(editId = null) {
    elements.modal.form.reset();
    
    // Uncheck all boxes
    document.querySelectorAll('input[name="equipment"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('input[name="services"]').forEach(cb => cb.checked = false);
    closeServicesDropdown();
    updateServicesSummary();

    // Reset assistants
    assistants = [];
    renderAssistants();

    // Reset Payment History
    currentPaymentHistory = [];
    renderPaymentHistory();

    // Reset Time Selectors
    resetTimeSelectors();

    if (elements.modal.form.elements['assistants']) {
        elements.modal.form.elements['assistants'].value = '';
    }

    if (editId) {
        elements.modal.title.textContent = 'Edit Booking';
        
        // Use local data to ensure responsiveness
        const b = bookings.find(x => x._id == editId);

        if (b) {
            try {
                // Fill Text Inputs
                for (const key in b) {
                    if (key === 'equipment' || key === 'services' || key === 'assistants' || key === 'startTime' || key === 'endTime' || key === 'advancePaid') continue;
                    const el = elements.modal.form.elements[key];
                    if (el && el.nodeType === 1 && b[key] !== undefined && b[key] !== null) {
                        el.value = b[key];
                    }
                }

                // Special handling for Advance Paid in Edit Mode
                // The input will be used for NEW payments, so we clear it initially
                // The history will show previous payments
                elements.modal.form.elements['advancePaid'].value = '';
                elements.modal.form.elements['advancePaid'].placeholder = 'Add new payment amount';

                // Ensure ID is set for update
                if (elements.modal.form.elements['id']) {
                    elements.modal.form.elements['id'].value = b._id;
                }

                // Fill Checkboxes
                if (b.equipment) {
                    b.equipment.forEach(item => {
                        const cb = document.querySelector(`input[name="equipment"][value="${item}"]`);
                        if(cb) cb.checked = true;
                    });
                }
                if (b.services && Array.isArray(b.services)) {
                    b.services.forEach(item => {
                        const cb = document.querySelector(`input[name="services"][value="${item}"]`);
                        if (cb) cb.checked = true;
                    });
                }
                updateServicesSummary();

                // Handle Time Selectors
                if (b.startTime) {
                    setTimeDropdowns(document.querySelector('.time-selector-group[data-target="startTime"]'), b.startTime);
                }
                if (b.endTime) {
                    setTimeDropdowns(document.querySelector('.time-selector-group[data-target="endTime"]'), b.endTime);
                }

                // Handle Assistants
                if (b.assistants) {
                    // Assuming assistants are stored as a comma-separated string
                    assistants = b.assistants.split(',').map(s => s.trim()).filter(s => s);
                    renderAssistants();
                }

                // Handle Payment History
                if (b.paymentHistory && Array.isArray(b.paymentHistory)) {
                    currentPaymentHistory = [...b.paymentHistory];
                } else if (b.advancePaid > 0) {
                    // Legacy support: if no history but advance exists, treat as initial payment
                    currentPaymentHistory = [{ amount: b.advancePaid, date: b.date || new Date().toISOString().split('T')[0] }];
                }
                renderPaymentHistory();

            } catch (e) {
                console.error('Error populating form:', e);
            }
        } else {
            alert('Booking details not found.');
            return;
        }
    } else {
        elements.modal.title.textContent = 'New Booking';
        const nextBookingNo = getNextBookingNumber();
        elements.modal.form.elements['bookingNo'].value = `BK-2026-${nextBookingNo}`;
        elements.modal.form.elements['customerId'].value = `CUST-${Math.floor(Math.random() * 1000)}`;
        elements.modal.form.elements['advancePaid'].placeholder = '0';
    }
    
    elements.modal.el.classList.add('active');
    elements.modal.form.scrollTop = 0;
}

function renderPaymentHistory() {
    const list = document.getElementById('paymentHistoryList');
    if (!list) return;
    list.innerHTML = '';

    if (currentPaymentHistory.length === 0) return;

    currentPaymentHistory.forEach(p => {
        const dateObj = new Date(p.date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = dateObj.toLocaleDateString('en-GB'); // DD/MM/YYYY

        let li = document.createElement('li');
        li.style.fontSize = '0.85rem';
        li.style.color = '#555';
        li.innerHTML = `<span>${dayName}, ${dateStr}</span> <span>₹${Number(p.amount).toLocaleString()}</span>`;
        list.appendChild(li);
    });
}

// --- VIEW DETAILS FUNCTION ---
function viewBooking(id) {
    const b = bookings.find(x => x._id == id);
    if (!b) return;

    // Helper to format tags
    const eqTags = b.equipment && b.equipment.length > 0 
        ? b.equipment.map(e => `<span class="eq-tag">${e}</span>`).join('') 
        : '<span style="color:#999; font-style:italic;">None</span>';
    const serviceTags = b.services && b.services.length > 0
        ? b.services.map(s => `<span class="eq-tag">${s}</span>`).join('')
        : '<span style="color:#999; font-style:italic;">None</span>';

    const balance = Number(b.estimatedCost) - Number(b.advancePaid);
    const balanceClass = balance > 0 ? 'balance-due' : 'balance-paid';

    // Logic for "Mark Completed" button
    // Show if status is not completed OR there is a balance remaining
    const showCompleteBtn = b.status !== 'completed' || balance > 0;
    const completeBtnHtml = showCompleteBtn ? `
        <button onclick="markBookingCompleted('${b._id}')" class="btn btn-outline btn-block">
            <i class="fa-solid fa-check"></i> Mark Completed
        </button>
    ` : '';

    elements.viewModal.body.innerHTML = `
        <div class="view-modal-body">
            
            <!-- Header -->
            <div class="view-header">
                <div>
                    <div class="view-booking-id">${b.bookingNo}</div>
                    <h2 class="view-title">${b.eventType}</h2>
                    <div class="view-date">
                        <i class="fa-regular fa-calendar"></i> ${b.date}
                    </div>
                </div>
                <div>
                    <span class="status-badge status-${b.status}" style="font-size:0.9rem; padding:8px 15px;">${b.status}</span>
                </div>
            </div>

            <div class="view-grid">
                
                <!-- Left Column: Details -->
                <div class="view-left-col">
                    
                    <!-- Logistics -->
                    <div class="view-section">
                        <h4 class="view-section-title">Logistics</h4>
                        <div class="logistics-row">
                            <div class="logistics-item">
                                <div class="logistics-label">Time</div>
                                <div class="logistics-value">${b.startTime} - ${b.endTime}</div>
                            </div>
                            <div class="logistics-item">
                                <div class="logistics-label">Location</div>
                                <div class="logistics-value">${b.location}</div>
                                <div class="logistics-sub">${b.locationAddress || ''}</div>
                            </div>
                        </div>
                    </div>

                    <!-- People -->
                    <div class="view-section">
                        <h4 class="view-section-title">People</h4>
                        <div class="people-grid">
                            <!-- Customer Card -->
                            <div class="info-card">
                                <span class="info-card-label">Customer</span>
                                <div class="info-card-name">${b.customerName}</div>
                            </div>
                            
                            <!-- Photographer Card -->
                            <div class="info-card">
                                <span class="info-card-label">Photographer</span>
                                <div class="info-card-name">${b.photographerName}</div>
                                <div class="info-card-detail"><i class="fa-brands fa-whatsapp"></i> ${b.photographerWhatsapp || '-'}</div>
                                <div style="margin-top:10px; padding-top:10px; border-top:1px solid #e0e0e0; font-size:0.85rem;">
                                    <span style="color:#888;">Assistants:</span> <span style="color:#333; font-weight:600;">${b.assistants || 'None'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Requirements -->
                    <div class="view-section">
                        <h4 class="view-section-title">Requirements</h4>
                        <div style="margin-bottom:15px;">
                            <div class="logistics-label" style="margin-bottom:8px;">Services</div>
                            <div class="tag-container">${serviceTags}</div>
                        </div>
                        <div style="margin-bottom:15px;">
                            <div class="logistics-label" style="margin-bottom:8px;">Equipment</div>
                            <div class="tag-container">${eqTags}</div>
                        </div>
                        <div>
                            <div class="logistics-label" style="margin-bottom:8px;">Special Requests</div>
                            <div class="special-req-box">
                                ${b.specialRequests || 'No special requests.'}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Finance & Actions -->
                <div class="view-right-col">
                    
                    <!-- Finance Card -->
                    <div class="payment-card">
                        <div class="payment-header">Payment Summary</div>
                        <div class="payment-body">
                            <div class="payment-row total">
                                <span>Total Cost</span>
                                <span>₹${Number(b.estimatedCost).toLocaleString()}</span>
                            </div>
                            <div class="payment-row">
                                <span>Advance Paid</span>
                                <span>₹${Number(b.advancePaid).toLocaleString()}</span>
                            </div>
                            
                            <div class="payment-divider"></div>
                            
                            <div class="payment-balance">
                                <span class="balance-label">Balance Due</span>
                                <span class="balance-amount ${balanceClass}">
                                    ₹${balance.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="view-actions">
                        ${completeBtnHtml}
                        <button onclick="downloadBookingPDF('${b._id}')" class="btn btn-outline btn-block">
                            <i class="fa-solid fa-file-pdf"></i> Download PDF
                        </button>
                        <button onclick="closeViewModal(); openModal('${b._id}')" class="btn btn-black btn-block">
                            <i class="fa-solid fa-pen"></i> Edit Booking
                        </button>
                        <button onclick="closeViewModal()" class="btn btn-outline btn-block" style="border-color:#ddd; color:#666;">
                            Close
                        </button>
                    </div>

                </div>

            </div>
        </div>
    `;
    elements.viewModal.el.classList.add('active');
    elements.viewModal.el.scrollTop = 0;
}

async function markBookingCompleted(id) {
    if(!confirm('Are you sure you want to mark this booking as Completed and Fully Paid?')) return;

    const b = bookings.find(x => x._id == id);
    if(!b) return;

    // Prepare updated data: Status completed, Advance = Estimated Cost (Balance 0)
    const updatedData = {
        ...b,
        status: 'completed',
        advancePaid: b.estimatedCost
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        const result = await response.json();
        if (result.success) {
            await fetchBookings(); // Refresh global data
            viewBooking(id);       // Re-render the modal to show changes
        } else {
            alert(result.message || 'Error updating booking');
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        alert('Server error occurred while updating booking.');
    }
}

async function deleteBooking(id) {
    if(confirm('Delete this booking?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                fetchBookings();
            } else {
                alert(result.message || 'Error deleting booking');
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
        }
    }
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    elements.buttons.toggleView.addEventListener('click', () => {
        viewMode = viewMode === 'list' ? 'calendar' : 'list';
        document.getElementById('viewBtnText').textContent = viewMode === 'list' ? 'Switch to Calendar' : 'Switch to List';
        renderView();
    });

    elements.buttons.newBooking.addEventListener('click', () => openModal());

    elements.modal.closeBtns.forEach(btn => {
        btn.addEventListener('click', closeBookingModal);
    });

    // View Modal Close
    elements.viewModal.closeBtn.addEventListener('click', closeViewModal);

    // Form Submit
    elements.modal.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(elements.modal.form);
        const id = formData.get('id'); // Will be empty for new bookings
        
        // Handle Checkboxes manually
        const checkedEquipment = [];
        document.querySelectorAll('input[name="equipment"]:checked').forEach(cb => checkedEquipment.push(cb.value));
        const checkedServices = [];
        document.querySelectorAll('input[name="services"]:checked').forEach(cb => checkedServices.push(cb.value));

        const bookingData = {};
        formData.forEach((value, key) => {
            if (key === 'id' && value === '') return;
            bookingData[key] = value;
        });
        bookingData.equipment = checkedEquipment;
        bookingData.services = checkedServices;

        // Handle Payment Logic
        const inputAdvance = Number(bookingData.advancePaid) || 0;
        
        if (id) {
            // EDIT MODE
            // If user entered a value in Advance Paid, treat it as a NEW payment
            if (inputAdvance > 0) {
                const newPayment = {
                    amount: inputAdvance,
                    date: new Date().toISOString().split('T')[0]
                };
                currentPaymentHistory.push(newPayment);
            }
            
            bookingData.paymentHistory = currentPaymentHistory;
            // Recalculate total advance
            bookingData.advancePaid = currentPaymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);

        } else {
            // NEW MODE
            // Initial advance is the first history entry
            if (inputAdvance > 0) {
                bookingData.paymentHistory = [{
                    amount: inputAdvance,
                    date: new Date().toISOString().split('T')[0]
                }];
            } else {
                bookingData.paymentHistory = [];
            }
            // bookingData.advancePaid is already set from form, which is correct for new booking
        }

        try {
            let response;
            if (id) {
                // Update existing
                response = await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                });
            } else {
                // Create new
                response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                });
            }

            const result = await response.json();
            if (result.success) {
                // Update local storage to track highest booking number (prevents reuse if deleted)
                if (bookingData.bookingNo) {
                    const parts = bookingData.bookingNo.split('-');
                    if (parts.length === 3) {
                        const num = parseInt(parts[2]);
                        const savedMax = localStorage.getItem('lastBookingNumber');
                        if (!savedMax || num > parseInt(savedMax)) {
                            localStorage.setItem('lastBookingNumber', num);
                        }
                    }
                }

                closeBookingModal();
                fetchBookings();

                // Trigger WhatsApp Redirection
                // We ask for confirmation to ensure popup blockers don't stop the window from opening
                if (bookingData.photographerWhatsapp && confirm("Booking Saved! Open WhatsApp to send details to the photographer?")) {
                    sendPhotographerWhatsApp(bookingData);
                }

            } else {
                alert(result.message || 'Error saving booking');
            }
        } catch (error) {
            console.error('Error saving booking:', error);
            alert('Server error occurred');
        }
    });

    elements.buttons.clearFilters.addEventListener('click', () => {
        elements.inputs.filters.forEach(i => i.value = '');
        renderView();
    });
    
    elements.inputs.filters.forEach(input => {
        input.addEventListener('input', renderView);
    });

    elements.inputs.calendarDate.addEventListener('change', (e) => {
        currentDate = e.target.value;
        renderCalendar();
    });

    // --- PAYMENT VALIDATION ---
    const costInput = elements.modal.form.elements['estimatedCost'];
    const advanceInput = elements.modal.form.elements['advancePaid'];

    function validatePayment() {
        const cost = parseFloat(costInput.value) || 0;
        const advance = parseFloat(advanceInput.value) || 0;
        if (advance > cost) {
            advanceInput.value = cost;
        }
    }

    if(costInput) costInput.addEventListener('input', validatePayment);
    if(advanceInput) advanceInput.addEventListener('input', validatePayment);
}

// --- BOOKING NUMBER GENERATION ---
function getNextBookingNumber() {
    let maxNum = 99;

    if (bookings && bookings.length > 0) {
        bookings.forEach(b => {
            if (b.bookingNo) {
                const parts = b.bookingNo.split('-');
                if (parts.length === 3) {
                    const num = parseInt(parts[2]);
                    if (!isNaN(num) && num > maxNum) {
                        maxNum = num;
                    }
                }
            }
        });
    }

    // Check localStorage for highest number to handle deleted records
    const savedMax = localStorage.getItem('lastBookingNumber');
    if (savedMax) {
        const savedNum = parseInt(savedMax);
        if (!isNaN(savedNum) && savedNum > maxNum) {
            maxNum = savedNum;
        }
    }

    return maxNum + 1;
}


// --- FORM HELPER FUNCTIONS (Simplified) ---

function initFormElements() {
    // 1. Initialize Time Selectors
    document.querySelectorAll('.time-selector-group').forEach(group => {
        const hSelect = group.querySelector('.time-h');
        const mSelect = group.querySelector('.time-m');
        const ampmSelect = group.querySelector('.time-ampm');
        
        populateTimeOptions(hSelect, mSelect);

        // Update hidden input when dropdowns change
        [hSelect, mSelect, ampmSelect].forEach(s => {
            s.addEventListener('change', () => updateHiddenTimeInput(group));
        });
        
        // Set initial value
        updateHiddenTimeInput(group);
    });

    // 2. Initialize Assistants
    const addBtn = document.getElementById('addAssistantBtn');
    const nameInput = document.getElementById('newAssistantName');

    if (addBtn && nameInput) {
        addBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if(name) {
                assistants.push(name);
                nameInput.value = '';
                renderAssistants();
            }
        });
    }

    // 3. Initialize Services multi-select dropdown
    const servicesDropdown = document.getElementById('servicesDropdown');
    const servicesTrigger = document.getElementById('servicesTrigger');

    if (servicesDropdown && servicesTrigger) {
        servicesTrigger.addEventListener('click', () => {
            const isOpen = servicesDropdown.classList.toggle('open');
            servicesTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        document.querySelectorAll('input[name="services"]').forEach(cb => {
            cb.addEventListener('change', updateServicesSummary);
        });

        document.addEventListener('click', (e) => {
            if (!servicesDropdown.contains(e.target)) {
                closeServicesDropdown();
            }
        });
    }

    updateServicesSummary();
}

function updateServicesSummary() {
    const summaryEl = document.getElementById('servicesSummary');
    if (!summaryEl) return;

    const selected = Array.from(document.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value);
    summaryEl.textContent = selected.length > 0 ? selected.join(' + ') : 'Select services';
}

function closeServicesDropdown() {
    const servicesDropdown = document.getElementById('servicesDropdown');
    const servicesTrigger = document.getElementById('servicesTrigger');
    if (servicesDropdown) servicesDropdown.classList.remove('open');
    if (servicesTrigger) servicesTrigger.setAttribute('aria-expanded', 'false');
}

function populateTimeOptions(hSelect, mSelect) {
    hSelect.innerHTML = '';
    for(let i=1; i<=12; i++) {
        let opt = document.createElement('option');
        opt.value = i;
        opt.text = i < 10 ? '0'+i : i;
        hSelect.appendChild(opt);
    }
    mSelect.innerHTML = '';
    for(let i=0; i<60; i+=5) {
        let opt = document.createElement('option');
        let val = i < 10 ? '0'+i : i;
        opt.value = val;
        opt.text = val;
        mSelect.appendChild(opt);
    }
}

function updateHiddenTimeInput(group) {
    const hSelect = group.querySelector('.time-h');
    const mSelect = group.querySelector('.time-m');
    const ampmSelect = group.querySelector('.time-ampm');
    const hiddenInput = group.nextElementSibling;

    let h = parseInt(hSelect.value || 12);
    let m = mSelect.value || '00';
    let ampm = ampmSelect.value;

    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    
    let hStr = h < 10 ? '0'+h : h;
    hiddenInput.value = `${hStr}:${m}`;
}

function setTimeDropdowns(group, timeString) {
    if (!timeString || !timeString.includes(':')) return;
    
    const hSelect = group.querySelector('.time-h');
    const mSelect = group.querySelector('.time-m');
    const ampmSelect = group.querySelector('.time-ampm');
    const hiddenInput = group.nextElementSibling;

    let [h, m] = timeString.split(':');
    h = parseInt(h);
    
    let ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;

    hSelect.value = h;
    mSelect.value = m;
    ampmSelect.value = ampm;
    hiddenInput.value = timeString;
}

function resetTimeSelectors() {
    document.querySelectorAll('.time-selector-group').forEach(group => {
        // Default to 12:00 PM or similar if needed, here just resetting logic
        const hSelect = group.querySelector('.time-h');
        const mSelect = group.querySelector('.time-m');
        const ampmSelect = group.querySelector('.time-ampm');
        if(hSelect) hSelect.value = 12;
        if(mSelect) mSelect.value = "00";
        if(ampmSelect) ampmSelect.value = "AM";
        updateHiddenTimeInput(group);
    });
}

function renderAssistants() {
    const list = document.getElementById('assistantsList');
    const hiddenInput = document.querySelector('input[name="assistants"]');
    
    if (!list || !hiddenInput) return;

    list.innerHTML = '';
    assistants.forEach((name, index) => {
        let li = document.createElement('li');
        li.innerHTML = `<span>${name}</span> <i class="fa-solid fa-trash" onclick="removeAssistant(${index})"></i>`;
        list.appendChild(li);
    });
    hiddenInput.value = assistants.join(', ');
}

// Expose removeAssistant to global scope for HTML onclick
window.removeAssistant = function(index) {
    assistants.splice(index, 1);
    renderAssistants();
}

// --- WHATSAPP INTEGRATION & TEMPLATES ---

const WhatsAppTemplates = {
    // Template 1: For Photographer (Assignment Details)
    photographer: (data) => {
        return `*NEW BOOKING ASSIGNMENT* 📸

*Booking No:* ${data.bookingNo || 'Pending'}
*Event:* ${data.eventType}
*Date:* ${data.date}
*Time:* ${data.startTime} - ${data.endTime}
*Location:* ${data.location}

*Client Name:* ${data.customerName}
*Equipment:* ${Array.isArray(data.equipment) ? data.equipment.join(', ') : 'Standard Kit'}

*Notes:* ${data.specialRequests || 'None'}

Please confirm availability.`;
    }
};

function formatPhoneNumber(phone) {
    if (!phone) return '';
    phone = phone.toString().replace(/\D/g, '');
    
    // Add Country Code if missing (Assuming 91 for India, adjust if needed)
    if (phone.length === 10) {
        phone = '91' + phone;
    }
    return phone;
}

function sendWhatsAppMessage(phone, text) {
    if (!phone) {
        alert('Phone number is missing.');
        return;
    }
    const url = `https://wa.me/${formatPhoneNumber(phone)}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function sendPhotographerWhatsApp(data) {
    const text = WhatsAppTemplates.photographer(data);
    sendWhatsAppMessage(data.photographerWhatsapp, text);
}

// --- PDF GENERATION ---
async function downloadBookingPDF(id) {
    const b = bookings.find(x => x._id == id);
    if (!b) return;

    if (!window.jspdf) {
        alert('PDF library not loaded. Please check internet connection.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Helper to load image
    const loadImage = (src) => new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = src;
    });

    // Helper to generate FontAwesome Icon Image
    const getCameraIconUrl = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 80px 'Font Awesome 6 Free'"; 
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\uf083", 50, 50); 
        return canvas.toDataURL('image/png');
    };

    const getFaIconUrl = (glyph, family = "'Font Awesome 6 Free'", weight = 900) => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `${weight} 76px ${family}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(glyph, 50, 50);
        return canvas.toDataURL('image/png');
    };

    try {
        // Load Logo
        let logoImg = null;
        try {
            logoImg = await loadImage('../images/VD_Photography_Logo.PNG');
        } catch (e) {
            console.warn("Logo could not be loaded:", e);
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const shellMargin = 0;
        const cardX = shellMargin;
        const cardY = shellMargin;
        const cardW = pageWidth - (shellMargin * 2);
        const cardH = pageHeight - (shellMargin * 2);
        const innerPad = 10;
        const left = cardX + innerPad;
        const right = cardX + cardW - innerPad;

        const safeText = (v, fallback = '-') => (v === undefined || v === null || v === '' ? fallback : String(v));
        const money = (v) => `Rs. ${Number(v || 0).toLocaleString()}`;

        // --- PAGE BASE ---
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // --- HEADER ---
        const headerH = 34;
        doc.setFillColor(0, 0, 0);
        doc.rect(cardX, cardY, cardW, headerH, 'F');

        try {
            const cameraIcon = getCameraIconUrl();
            doc.addImage(cameraIcon, 'PNG', left, cardY + 8, 18, 18);
        } catch (e) {
            console.warn("Could not generate camera icon", e);
        }

        if (logoImg) {
            doc.addImage(logoImg, 'PNG', left + 50, cardY + 1, 90, 32);
        } else {
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.text("vd photography & films", left + 16, cardY + 19);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("BOOKING RECEIPT", right, cardY + 22, { align: "right" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Booking No: ${safeText(b.bookingNo)}`, right, cardY + 27, { align: "right" });

        const labelColor = [98, 98, 98];
        const bodyColor = [20, 20, 20];
        const footerH = 34;
        const footerY = cardY + cardH - footerH;
        const sectionX = left;
        const sectionW = cardW - (innerPad * 2);
        const gridGap = 6;
        const colGap = 6;
        const colW = (sectionW - colGap) / 2;
        const cardPad = 4;

        const clipLines = (lines, maxLines) => {
            if (lines.length <= maxLines) return lines;
            const clipped = lines.slice(0, maxLines);
            clipped[maxLines - 1] = `${clipped[maxLines - 1]}...`;
            return clipped;
        };

        const drawCard = (title, x, yPos, w, h) => {
            doc.setFillColor(248, 248, 248);
            doc.setDrawColor(226, 226, 226);
            doc.setLineWidth(0.25);
            doc.roundedRect(x, yPos, w, h, 1.5, 1.5, 'FD');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8.2);
            doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
            doc.text(title.toUpperCase(), x + cardPad, yPos + 6);
            return yPos + 11;
        };

        const drawKV = (x, yPos, label, value, width, maxLines = 2) => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9.6);
            doc.setTextColor(0, 0, 0);
            const labelText = `${label}: `;
            doc.text(labelText, x, yPos);
            const labelW = doc.getTextWidth(labelText);
            doc.setFont("helvetica", "normal");
            const lines = clipLines(doc.splitTextToSize(safeText(value), Math.max(12, width - labelW)), maxLines);
            doc.text(lines, x + labelW, yPos);
            return yPos + (lines.length * 4.5);
        };

        let y = cardY + headerH + 3;
        const row1H = 35;
        const row2H = 50;
        const row3H = 26;
        const leftX = sectionX;
        const rightX = sectionX + colW + colGap;

        // Row 1: Photographer + Booking
        let cY = drawCard("Photographer Details", leftX, y, colW, row1H);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11.5);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const phName = clipLines(doc.splitTextToSize(safeText(b.photographerName, "Not Assigned").toUpperCase(), colW - (cardPad * 2)), 2);
        doc.text(phName, leftX + cardPad, cY);
        cY += (phName.length * 4.6) + 1;
        cY = drawKV(leftX + cardPad, cY, "Whatsapp", b.photographerWhatsapp || "Not provided", colW - (cardPad * 2), 1);
        drawKV(leftX + cardPad, cY + 1, "Assistants", b.assistants || "None", colW - (cardPad * 2), 1);

        cY = drawCard("Booking Info", rightX, y, colW, row1H);
        cY = drawKV(rightX + cardPad, cY, "Booking No", b.bookingNo, colW - (cardPad * 2), 1);
        cY = drawKV(rightX + cardPad, cY + 1, "Date", b.date, colW - (cardPad * 2), 1);
        drawKV(rightX + cardPad, cY + 1, "Time", `${safeText(b.startTime)} - ${safeText(b.endTime)}`, colW - (cardPad * 2), 1);

        y += row1H + gridGap;

        // Row 2: Client + Event/Location
        cY = drawCard("Client Details", leftX, y, colW, row2H);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const clientName = clipLines(doc.splitTextToSize(safeText(b.customerName, "Unknown Client").toUpperCase(), colW - (cardPad * 2)), 2);
        doc.text(clientName, leftX + cardPad, cY);
        cY += (clientName.length * 4.6) + 1;
        cY = drawKV(leftX + cardPad, cY, "ID", b.customerId, colW - (cardPad * 2), 1);
        drawKV(leftX + cardPad, cY + 1, "Special Req", b.specialRequests || "None", colW - (cardPad * 2), 2);

        cY = drawCard("Event & Location", rightX, y, colW, row2H);
        cY = drawKV(rightX + cardPad, cY, "Event", b.eventType, colW - (cardPad * 2), 1);
        cY = drawKV(rightX + cardPad, cY + 1, "Location", b.location, colW - (cardPad * 2), 1);
        drawKV(rightX + cardPad, cY + 1, "Address", b.locationAddress, colW - (cardPad * 2), 2);

        y += row2H + gridGap;

        // Row 3: Equipment (full-width highlighted row)
        const equipmentX = sectionX;
        const equipmentW = sectionW;
        doc.setFillColor(238, 238, 238);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.35);
        doc.roundedRect(equipmentX, y, equipmentW, row3H, 1.5, 1.5, 'FD');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(75, 75, 75);
        doc.text("EQUIPMENT CHECKLIST", equipmentX + cardPad, y + 6);

        const eqText = Array.isArray(b.equipment) && b.equipment.length > 0 ? b.equipment.join(', ') : 'None';
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(bodyColor[0], bodyColor[1], bodyColor[2]);
        const eqLines = clipLines(doc.splitTextToSize(eqText.toUpperCase(), equipmentW - (cardPad * 2)), 2);
        doc.text(eqLines, equipmentX + cardPad, y + 13);

        y += row3H + 5;
        y = Math.min(y, footerY - 70);

        // --- DESCRIPTION TABLE ---
        const tableBody = [
            [
                { content: `${Array.isArray(b.services) && b.services.length > 0 ? b.services.join(' + ') : safeText(b.eventType)}${b.packageDetails ? `\n${b.packageDetails}` : ''}`, styles: { fontStyle: 'normal' } },
                money(b.estimatedCost)
            ]
        ];

        doc.autoTable({
            startY: y,
            head: [['DESCRIPTION', 'AMOUNT']],
            body: tableBody,
            theme: 'grid',
            styles: {
                fontSize: 10,
                cellPadding: 5,
                textColor: [20, 20, 20],
                lineColor: [225, 225, 225],
                lineWidth: 0.25
            },
            headStyles: {
                fillColor: [242, 242, 242],
                textColor: [70, 70, 70],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 45, halign: 'right' }
            },
            margin: { left: sectionX, right: pageWidth - (sectionX + sectionW) }
        });

        y = doc.lastAutoTable.finalY + 7;

        // --- TOTALS & PAYMENT HISTORY ---
        const rightCol = right;
        const balance = Number(b.estimatedCost || 0) - Number(b.advancePaid || 0);

        const printRow = (label, value, yPos, bold = false, muted = false) => {
            doc.setFont("helvetica", bold ? "bold" : "normal");
            doc.setFontSize(bold ? 11 : 10);
            const color = muted ? 110 : 20;
            doc.setTextColor(color, color, color);
            doc.text(label, left, yPos);
            doc.text(value, rightCol, yPos, { align: 'right' });
        };

        printRow("Total Amount:", money(b.estimatedCost), y, true);
        y += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(100, 100, 100);
        doc.text("Payment History:", left, y);
        y += 6;

        if (b.paymentHistory && b.paymentHistory.length > 0) {
            b.paymentHistory.forEach((p) => {
                const d = new Date(p.date);
                const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
                const dateStr = d.toLocaleDateString('en-GB');
                printRow(`${dayStr}, ${dateStr}`, money(p.amount), y, false, true);
                y += 6;
            });
        } else {
            printRow("Advance Paid", money(b.advancePaid), y, false, true);
            y += 6;
        }

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(left, y - 2, rightCol, y - 2);

        printRow("Balance Due:", money(balance), y + 4, true);

        // --- FOOTER ---
        doc.setFillColor(0, 0, 0);
        doc.rect(cardX, footerY, cardW, footerH, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("VD PHOTOGRAPHY & FILMS", cardX + cardW / 2, footerY + 9, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text("OUR CONTACT", cardX + cardW / 2, footerY + 15, { align: "center" });

        const contactY = footerY + 23;
        const contactXs = [cardX + (cardW * 0.2), cardX + (cardW * 0.45), cardX + (cardW * 0.68)];
        const contacts = [
            { icon: getFaIconUrl("\uf095"), text: "+91 7218051297" },
            { icon: getFaIconUrl("\uf0e0"), text: "vdswdb@gmail.com" },
            { icon: getFaIconUrl("\uf16d", "'Font Awesome 6 Brands'", 400), text: "vd_photography_films" }
        ];

        contacts.forEach((item, idx) => {
            const x = contactXs[idx];
            try {
                doc.addImage(item.icon, 'PNG', x - 2.9, contactY - 3.1, 3.1, 3.1);
            } catch (e) {
                console.warn("Footer icon could not be rendered", e);
            }

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.1);
            doc.text(item.text, x + 0.5, contactY - 0.4, { align: "left" });
        });

        doc.save(`Booking_${safeText(b.bookingNo, "Receipt")}.pdf`);

    } catch (error) {
        console.error("PDF Error:", error);
        alert("Error generating PDF.");
    }
}

// Expose to window for HTML onclick events
window.markBookingCompleted = markBookingCompleted;
window.downloadBookingPDF = downloadBookingPDF;
window.closeViewModal = closeViewModal;

// Start
init();
