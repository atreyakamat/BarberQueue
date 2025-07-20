console.log('Starting server...');
try {
  const express = require('express');
  console.log('Express loaded successfully');
  
  const mongoose = require('mongoose');
  console.log('Mongoose loaded successfully');
  
  const cors = require('cors');
  console.log('CORS loaded successfully');
  
  console.log('All dependencies loaded successfully');
} catch (error) {
  console.error('Error loading dependencies:', error);
}
