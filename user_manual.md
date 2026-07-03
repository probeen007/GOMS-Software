# DriveSync Garage Operations — Comprehensive End-to-End User Manual

Welcome to the **DriveSync Garage Management System User Manual**. This document details the end-to-end operation of the web application, highlighting roles, operational flows, and step-by-step procedures to manage your garage digitally.

---

## 👥 Role-Specific Access & Security Matrix

DriveSync uses a Role-Based Access Control (RBAC) system to ensure staff members only access components relevant to their duties.

| Feature / Module | Admin | Receptionist | Technician | Accountant | Customers (Public Link) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **System Dashboard** | Full | Front-Desk | Floor-List | Finance-List | No Access |
| **Customers & Vehicles** | Read/Write | Read/Write | Read Only | No Access | No Access |
| **Appointments & Check-in** | Read/Write | Read/Write | Read Only | No Access | No Access |
| **Inventory & Parts Catalog** | Read/Write | Read Only | Read Only | Read/Write | No Access |
| **Record Stock Purchase** | Read/Write | No Access | No Access | Read/Write | No Access |
| **Quotation Builder** | Read/Write | Read/Write | Read/Write | Read/Write | No Access |
| **Quotation Public Page** | View Only | View Only | View Only | View Only | Approve / Reject |
| **Active Job Cards** | Read/Write | Read/Write | Read/Write | No Access | No Access |
| **Invoices & Credit Notes** | Read/Write | Read Only | No Access | Read/Write | No Access |
| **Record Payments** | Read/Write | Read/Write | No Access | Read/Write | No Access |
| **Loyalty Point Redemptions**| Read/Write | Read/Write | No Access | Read/Write | No Access |
| **Finance Reports & Charts** | Read/Write | No Access | No Access | Read/Write | No Access |
| **Staff Accounts Manager** | Full | No Access | No Access | No Access | No Access |
| **System Audit Logs** | Full | No Access | No Access | No Access | No Access |
| **To-Do List Tasks** | Read/Write | Read/Write | Status Only | Read/Write | No Access |

---

## 🚗 Core Operational Journey (End-to-End Workflow)

This section provides detailed, step-by-step instructions on how to take a customer vehicle through the entire garage lifecycle.

### 📅 Step 1: Appointment Booking
*   **Primary Roles:** Receptionist, Admin
*   **Goal:** Register a customer request and schedule a workshop slot.
*   **How to Use:**
    1. Navigate to the **Appointments** page using the left-hand sidebar menu.
    2. Click the blue **Create Appointment** button in the upper-right corner. This will slide open a modal form.
    3. In the **Customer Details** field, type the customer's name to search existing files. If they are a new client, click **+ Add Customer** to enter their name, phone, email, and billing address.
    4. In the **Vehicle Details** field, select the vehicle. If it is not listed, click **+ Add Vehicle** to register it (input plate number, manufacturer make, model, year, and vehicle color).
    5. Set the **Appointment Date & Time** using the scheduling picker.
    6. Select the **Service Type** (e.g., General Service, Engine Repair, Brake Maintenance, Suspension Check).
    7. Choose the **Assign Technician** dropdown and select the technician. 
    8. Add any **Diagnostic Intake Comments** or customer complaints (e.g., "Squeaking sound when brakes are applied").
    9. Click the **Schedule** button.
    > [!WARNING]
    > **Schedule Conflict Verification:** The system automatically checks if the assigned technician has another appointment overlapping at the selected hour. If they do, a warnings alert is displayed, and the appointment booking is blocked until a different technician or time is selected.

### 🔍 Step 2: Vehicle Intake & Check-In
*   **Primary Roles:** Receptionist, Admin, Technician
*   **Goal:** Capture vehicle health state, mileage, and condition photos upon physical arrival.
*   **How to Use:**
    1. When the customer arrives at the shop, open the **Appointments** calendar or list page.
    2. Locate the customer's appointment block and click **Check-In**.
    3. Under **Odometer Reading**, input the exact mileage displayed on the dashboard dashboard.
    4. Use the interactive checklist to mark **Pre-Existing Vehicle Damages**. Select where the scratches or dents are located and type details (e.g., "Scratch on passenger rear side door").
    5. Under **Condition Photos**, click the upload area and upload photos of the vehicle from your mobile device or computer camera (captures the condition of the car at intake).
    6. Review and hit **Confirm Check-In**.
       - The system changes the status badge to `checked-in` and creates the intake checklist.
       - In-app notifications alert technicians that the vehicle is ready for physical inspection.

### 📝 Step 3: Estimate & Quotation Building
*   **Primary Roles:** Technician, Admin, Receptionist, Accountant
*   **Goal:** Inspect the vehicle, list repair works, allocate spares from inventory, and send the quote to the customer.
*   **How to Use:**
    1. Under the **Quotations** tab, click **New Quotation** and link it to the checked-in vehicle/appointment.
    2. Under **Billable Parts / Spares**:
       - Click **Add Part**. Start typing the name of the replacement component (e.g., "Front Brake Pads").
       - The system queries the database catalog, autocompletes the part details, displays the current stock levels, and fills in the default unit price.
       - Enter the quantity needed. The system verifies if there is enough stock available.
    3. Under **Billable Labour**:
       - Click **Add Labour Line**.
       - Type the description of the labor (e.g., "Install front brake pads").
       - Input the estimated **Hours** required and the technician's hourly rate. The total labor cost is computed automatically.
    4. If appropriate, enter a **Discount Percentage** (0% - 100%). The system automatically calculates:
       - Subtotal (sum of parts and labour).
       - Discount (deducted from subtotal).
       - VAT (13% tax applied to the discounted subtotal).
       - Total Payable Amount.
    5. Click **Save as Draft**.
    > [!IMPORTANT]
    > **Draft Status Security Block:** While a quotation is in **Draft**, the approval controls on the public webpage are disabled. The customer will not be able to accept or reject it. You must change the state to "Sent" to authorize customer interaction.
    6. Once review is complete, click **Publish & Send**. The status transitions to `sent`, and a unique secure URL token is generated (e.g., `/quote-approval/d7a8f9b6...`).

### 📱 Step 4: Customer Quotation Review & Approval
*   **Primary Role:** Customer (Public portal link, no login required)
*   **Goal:** Review and digitally sign off on the proposed repair costs.
*   **How to Use:**
    1. The garage staff shares the tokenized URL link with the client.
    2. The customer opens the link on their mobile phone or web browser. They will see a professionally styled, responsive estimate summary.
    3. The customer can review the cost breakdown.
    4. To approve the repair job:
       - The customer clicks the green **Approve Estimate** button.
       - A prompt asks them to enter their name or digital signature.
       - The quote status instantly updates to `approved`.
       - **System Automation:** The backend automatically creates a **Job Card** pre-populated with all the approved parts, quantities, and labor details from the quotation.
    5. To decline the estimate:
       - The customer clicks the red **Decline Estimate** button and inputs a decline reason (e.g., "Too expensive").
       - The quote status changes to `rejected`, and the receptionist is notified to contact the customer.

### 🛠️ Step 5: Workshop Floor Execution (Job Cards)
*   **Primary Roles:** Technician, Admin, Receptionist
*   **Goal:** Perform the mechanical work and record parts usage.
*   **How to Use:**
    1. Technicians log into the system and navigate to the **Job Cards** section.
       - *Note:* Technicians are restricted via RBAC filters and will only see job cards assigned to them.
    2. Click on the active Job Card to open the workshop floor workspace.
    3. If additional parts are required during the repair process, the technician clicks **Allocate Parts**:
       - Select the item and quantity.
       - **System Automation:** Submitting changes **immediately decrements the stock levels** in the live inventory catalog. If the quantity drops below the safety margin, the system flags the SKU as "Low Stock" and alerts the admin.
    4. The technician documents repair notes under **Inspection Findings & Work Logs** (e.g., "Removed worn pads, cleaned rotors, installed new OEM pads").

### 📁 Step 6: Job Card Closure & Invoicing
*   **Primary Roles:** Technician, Admin, Receptionist
*   **Goal:** Close the work card and authorize billing.
*   **How to Use:**
    1. When work on the vehicle is complete, open the active Job Card.
    2. Input the final **Mileage Out** (odometer reading upon test drive completion).
    3. Click the **Close Job Card** button and confirm.
       - The status transitions to `closed`.
       - The closing timestamp is recorded.
       - **System Automation:** The system immediately generates an official **Tax Invoice** under the billing ledger, pre-populating client, vehicle, parts, labor totals, VAT, and discounts.

### 💳 Step 7: Billing, Settlements & WhatsApp Receipts
*   **Primary Roles:** Accountant, Receptionist, Admin
*   **Goal:** Record customer payment, settle the invoice, and issue a digital receipt.
*   **How to Use:**
    1. Navigate to the **Invoices** page. Unpaid invoices are marked with red "Unpaid" badges.
    2. Open the target invoice and click the **Record Payment** button.
    3. In the payment form:
       - Enter the **Payment Amount**.
       - Select the **Payment Method** (Cash, Card, ConnectIPS, Bank Transfer).
       - Add a **Reference Note** (e.g., transaction ID, bank reference).
    4. **Loyalty Points Discount Redemption:**
       - If the customer has accumulated points, the system displays their redeemable value (e.g., "500 points available = Rs. 50.00 discount").
       - Select the **Redeem Points** checkbox to deduct the points balance and apply a matching credit note discount directly to the invoice.
    5. Toggle **Send WhatsApp Receipt** and click **Submit Payment**.
       - **System Automation (WhatsApp Receipt Redirect):**
         - The system formats a customized, professional receipt message.
         - The system formats the Nepalese phone number: it removes all non-numeric characters, verifies that it is a 10-digit number starting with `9`, and prepends the country code `977`.
         - A new tab opens redirecting to `https://wa.me/977XXXXXXXXXX?text=...`, allowing the receptionist to send the receipt directly via WhatsApp.

### 🎁 Step 8: Loyalty Points Credit
*   **Primary Role:** System Automated
*   **Goal:** Award customers points on completed transactions to encourage repeat visits.
*   **How to Use:**
    - When an invoice transitions to the `paid` status (balance due becomes 0), the system automatically calculates the loyalty reward points.
    - Points are awarded at a rate of **1 Loyalty Point for every Rs. 10** of the invoice total.
    - The customer's profile is updated, and the transaction is recorded in the **Loyalty Ledger** for audit purposes.

---

## 📈 Management & Support Modules

### 📦 1. Inventory Control & Auto-Expenses
*   **Inventory Monitoring:** The inventory screen displays items in a grid. Any item with a quantity less than or equal to `minQty` is highlighted with a red warning flag.
*   **Record Purchase (Restocking):**
    1. Navigate to **Inventory** → **Record Purchase**.
    2. Select the supplier name.
    3. Add the restocked parts, inputting the quantity and the unit cost at the time of purchase.
    4. Submit the purchase.
       - **System Automation:** The stock levels of the listed items increase immediately.
       - **Finance Link:** The system **automatically registers a matching Expenditure entry** in the Cash Flow ledger, preventing manual bookkeeping duplication.
*   **Midnight Stock Audit:** A daily `node-cron` job runs at midnight. It sweeps the inventory database, identifies low-stocked SKUs, and issues in-app alerts to admin and accountant users.

### 📊 2. Finance Reports & Cash Flow
*   Navigate to **Finance Reports**.
*   The page renders an interactive cash flow chart using Recharts.
*   **Data Sources:**
    - **Income:** Derived from payments recorded against invoices.
    - **Expenditures:** Derived from inventory restock purchases and manual expense logging (e.g., rent, utilities).
*   **Filter:** Use the date range pickers to filter the cash flow data and summary metrics.
*   **Add Expenditure Manual Form:** Click **Add Expense** to record manual shop overhead costs.

### 🔔 3. In-App Notifications Bell
*   A live notification bell is located in the Topbar.
*   It displays an unread count badge.
*   Notifications are targeted by role (e.g., accountants receive payment notifications; technicians receive job card updates; admins see audit and low stock alerts).
*   Click the bell to mark items as read.

### 📝 4. To-Do List Tasks (RBAC Enforced)
*   **Admins, Receptionists, and Accountants** have full permissions: they can create new tasks, assign them to staff members, edit details, and delete tasks.
*   **Technicians** are restricted: they can only view tasks assigned to them, and the edit controls are locked except for the **Status** dropdown (enabling them to mark their tasks as *Not Started*, *In Progress*, or *Completed*).

### 📋 5. System Audit Log
*   Admins can access **Audit Logs** to view a secure, timestamped record of every creation, deletion, or modification made to core schemas (appointments, job cards, invoices, and inventory).
*   Logs record the active user, IP/request details, the type of change, and a details string explaining the operation.

### 🌐 6. Public Landing Page
*   **Landing Page URL:** `http://localhost:3000/landing.html`.
*   Unauthenticated visitors typing in the main domain `http://localhost:3000/` are automatically redirected here.
*   The landing page showcases garage services, company history, and team members.
*   Clicking **Login** routes the browser to `/login`. Once signed in, the system allows the user to access the operational dashboard.
