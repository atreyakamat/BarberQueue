# BarberQueue 💈

An Indian Barber-Centric Appointment & Queue Management Web App

## Features

### For Customers
- 📱 Mobile-first responsive design
- 🔐 Secure authentication with phone/email
- 💇 Book appointments with service selection
- ⏰ Join live queues and view wait times
- 🔔 Get notified when turn approaches
- 📊 View booking status and history

### For Barbers
- 🎯 Manage appointments and queues
- ⏰ Set available time slots
- 🛠️ Update services and pricing
- 📋 Track customer status
- 📈 Dashboard with real-time updates

## Tech Stack

### Frontend
- React.js with hooks
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Socket.io-client for real-time updates

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT authentication
- Socket.io for real-time features
- Bcrypt for password hashing

## Setup Instructions

### 1. Install Dependencies
```bash
npm run install-deps
```

### 2. Environment Setup
Create `.env` files in both client and server folders with required variables.

### 3. Start Development
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Services
- `GET /api/services` - Get all services
- `POST /api/services` - Create service (barber only)
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user/:id` - Get user bookings
- `GET /api/bookings/barber/:id` - Get barber bookings
- `PUT /api/bookings/:id` - Update booking status

### Queue
- `GET /api/queue/:barberId` - Get queue for barber
- `POST /api/queue/join` - Join queue
- `PUT /api/queue/update` - Update queue status

## Database Models

### User
- name, phone, email, password, role (customer/barber)

### Service
- name, price, duration, description

### Booking
- user, barber, services, status, scheduledTime

### Queue
- barber, queue items with booking references

## Deployment

### Frontend (Netlify/Vercel)
- Build: `npm run build`
- Deploy dist folder

### Backend (Render/Railway)
- Deploy server folder
- Set environment variables

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License - see LICENSE file for details
