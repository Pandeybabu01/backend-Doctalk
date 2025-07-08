// // utils/fakeRazorpay.js

// export default {
//   orders: {
//     create: async (options) => {
//       console.log('🧪 Fake Razorpay order created with:', options);
//       return {
//         id: 'order_FAKE_' + Math.floor(Math.random() * 1000000),
//         amount: options.amount,
//         currency: options.currency,
//         receipt: options.receipt,
//         status: 'created',
//       };
//     },
//     fetch: async (orderId) => {
//       console.log('🧪 Fake Razorpay order fetched for:', orderId);
//       // Simulate payment success or failure randomly
//       return {
//         id: orderId,
//         receipt: orderId.split('_').pop(), // Simulated receipt (appointmentId)
//         status: 'paid', // or 'created' to simulate pending
//       };
//     },
//   },
// };


// utils/fakeRazorpay.js

export default {
  orders: {
    create: async (options) => {
      const fakeOrderId = 'order_FAKE_' + Math.floor(Math.random() * 1000000);
      const now = Math.floor(Date.now() / 1000);
      console.log('🧪 Fake Razorpay order created with:', options);
      return {
        id: fakeOrderId,
        entity: 'order',
        amount: options.amount,
        amount_paid: 0,
        amount_due: options.amount,
        currency: options.currency || 'INR',
        receipt: options.receipt,
        status: 'created',
        attempts: 0,
        created_at: now,
      };
    },

    fetch: async (orderId) => {
      console.log('🧪 Fake Razorpay order fetched for:', orderId);
      const statuses = ['created', 'paid', 'failed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const amount = 10000;
      return {
        id: orderId,
        entity: 'order',
        amount,
        amount_paid: randomStatus === 'paid' ? amount : 0,
        amount_due: randomStatus === 'paid' ? 0 : amount,
        currency: 'INR',
        receipt: 'rcptid_' + orderId.split('_').pop(),
        status: randomStatus,
        attempts: 1,
        created_at: Math.floor(Date.now() / 1000),
      };
    },
  },
};
