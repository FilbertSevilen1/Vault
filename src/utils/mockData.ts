import db from '../db/vaultDb';
import { subMonths, format, startOfMonth, addDays } from 'date-fns';

export const seedMockData = async () => {
  // Clear any existing data
  await Promise.all([
    db.transactions.clear(),
    db.investments.clear(),
    db.goals.clear()
  ]);

  const now = new Date();
  
  // 1. Seed Goals
  const mockGoals = [
    {
      name: 'Emergency Fund',
      targetAmount: 15000,
      currentAmount: 10500,
      deadline: format(addDays(now, 180), 'yyyy-MM-dd'),
      notes: '6 months of living expenses stored in high-yield savings account.'
    },
    {
      name: 'Japan Vacation',
      targetAmount: 6000,
      currentAmount: 4200,
      deadline: format(addDays(now, 90), 'yyyy-MM-dd'),
      notes: 'For flights, hotels, and sushi in Tokyo & Kyoto.'
    },
    {
      name: 'House Deposit',
      targetAmount: 100000,
      currentAmount: 32000,
      deadline: format(addDays(now, 720), 'yyyy-MM-dd'),
      notes: 'Downpayment for a 2-bedroom apartment.'
    },
    {
      name: 'New Performance PC',
      targetAmount: 3500,
      currentAmount: 1500,
      deadline: format(addDays(now, 45), 'yyyy-MM-dd'),
      notes: 'New workstation setup for gaming and development.'
    }
  ];

  await db.goals.bulkAdd(mockGoals);

  // 2. Seed Investments
  const mockInvestments = [
    {
      assetName: 'Apple Inc. (AAPL)',
      assetType: 'Stocks' as const,
      quantity: 15,
      buyPrice: 175.50,
      currentValue: 192.30,
      purchaseDate: format(subMonths(now, 10), 'yyyy-MM-dd'),
      notes: 'Tech growth holding, dividend paying.'
    },
    {
      assetName: 'Vanguard S&P 500 ETF (VOO)',
      assetType: 'ETFs' as const,
      quantity: 45,
      buyPrice: 420.10,
      currentValue: 465.75,
      purchaseDate: format(subMonths(now, 11), 'yyyy-MM-dd'),
      notes: 'Core long-term index ETF holding.'
    },
    {
      assetName: 'Bitcoin (BTC)',
      assetType: 'Crypto' as const,
      quantity: 0.25,
      buyPrice: 43200,
      currentValue: 68450,
      purchaseDate: format(subMonths(now, 8), 'yyyy-MM-dd'),
      notes: 'Digital gold store of value asset.'
    },
    {
      assetName: 'Ethereum (ETH)',
      assetType: 'Crypto' as const,
      quantity: 2.1,
      buyPrice: 2200,
      currentValue: 3540,
      purchaseDate: format(subMonths(now, 6), 'yyyy-MM-dd'),
      notes: 'Smart contract ecosystem core utility asset.'
    },
    {
      assetName: 'SPDR Gold Shares (GLD)',
      assetType: 'Gold' as const,
      quantity: 20,
      buyPrice: 185.00,
      currentValue: 215.20,
      purchaseDate: format(subMonths(now, 12), 'yyyy-MM-dd'),
      notes: 'Inflation hedge asset.'
    }
  ];

  await db.investments.bulkAdd(mockInvestments);

  // 3. Seed Transactions (Monthly recurring and random daily)
  const transactions: any[] = [];
  const categories = {
    expense: [
      { category: 'Food', notes: ['Whole Foods', 'Trader Joe\'s', 'Ramen Dining', 'Coffee shop', 'Uber Eats', 'Blue Bottle Coffee'] },
      { category: 'Transport', notes: ['Uber Ride', 'Metro Pass', 'Gas Station', 'Car Wash'] },
      { category: 'Shopping', notes: ['Amazon purchase', 'Nike Store', 'Apple Store Accessories', 'Warm Hoodie', 'Bookstore'] },
      { category: 'Entertainment', notes: ['Netflix Premium', 'Spotify Family', 'Cinema Tickets', 'Concert ticket', 'Nintendo eShop'] },
      { category: 'Bills', notes: ['Electricity Bill', 'Water Bill', 'Internet Plan', 'Mobile phone contract', 'Gym Membership'] },
      { category: 'Healthcare', notes: ['Pharmacy prescription', 'Dental Checkup', 'Multivitamins'] },
      { category: 'Travel', notes: ['Hotel Booking', 'Flight Ticket', 'Train ride'] },
      { category: 'Other', notes: ['Gift for friend', 'Dry Cleaning'] }
    ],
    income: [
      { category: 'Salary', notes: ['Monthly Salary Acme Corp'] },
      { category: 'Freelance', notes: ['Web Development Contract', 'UI Design consulting'] },
      { category: 'Business', notes: ['SaaS subscription revenue', 'E-commerce profits'] },
      { category: 'Investments', notes: ['Stock Dividend payouts', 'ETF distribution'] },
      { category: 'Other', notes: ['Cashback reward', 'Birthday gift'] }
    ]
  };

  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Apple Pay'];

  // Seed data going back 12 months
  for (let m = 11; m >= 0; m--) {
    const monthStart = startOfMonth(subMonths(now, m));
    
    // Add Salary (once a month, early in the month)
    transactions.push({
      type: 'income',
      amount: 4500,
      category: 'Salary',
      date: format(addDays(monthStart, 1), 'yyyy-MM-dd'),
      notes: 'Acme Corp Monthly Salary'
    });

    // Add rent expense (once a month)
    transactions.push({
      type: 'expense',
      amount: 1400,
      category: 'Bills',
      date: format(addDays(monthStart, 2), 'yyyy-MM-dd'),
      notes: 'Apartment Monthly Rent',
      paymentMethod: 'Bank Transfer'
    });

    // Add utility bills (once a month)
    transactions.push({
      type: 'expense',
      amount: 120 + Math.floor(Math.random() * 40),
      category: 'Bills',
      date: format(addDays(monthStart, 5), 'yyyy-MM-dd'),
      notes: 'Electric & Gas Utilities',
      paymentMethod: 'Debit Card'
    });
    
    transactions.push({
      type: 'expense',
      amount: 65,
      category: 'Bills',
      date: format(addDays(monthStart, 7), 'yyyy-MM-dd'),
      notes: 'Fiber Broadband Internet',
      paymentMethod: 'Credit Card'
    });

    // Add Freelance Income (some months)
    if (m % 2 === 0) {
      transactions.push({
        type: 'income',
        amount: 800 + Math.floor(Math.random() * 600),
        category: 'Freelance',
        date: format(addDays(monthStart, 15), 'yyyy-MM-dd'),
        notes: 'UI Design Freelance Consultation'
      });
    }

    // Add Dividends (every 3 months)
    if (m % 3 === 0) {
      transactions.push({
        type: 'income',
        amount: 120 + Math.floor(Math.random() * 80),
        category: 'Investments',
        date: format(addDays(monthStart, 20), 'yyyy-MM-dd'),
        notes: 'Stock & ETF Dividends'
      });
    }

    // Add random daily expenses (food, transport, shopping, entertainment, travel)
    const transactionCount = 10 + Math.floor(Math.random() * 8);
    for (let i = 0; i < transactionCount; i++) {
      const dateDay = addDays(monthStart, 3 + Math.floor(Math.random() * 25));
      
      const itemGroup = categories.expense[Math.floor(Math.random() * categories.expense.length)];
      const notesList = itemGroup.notes;
      const notesSelected = notesList[Math.floor(Math.random() * notesList.length)];
      
      // Determine amount based on category
      let amount = 10 + Math.floor(Math.random() * 40); // food/transport default
      if (itemGroup.category === 'Shopping') {
        amount = 30 + Math.floor(Math.random() * 170);
      } else if (itemGroup.category === 'Travel') {
        amount = 150 + Math.floor(Math.random() * 300);
      } else if (itemGroup.category === 'Healthcare') {
        amount = 25 + Math.floor(Math.random() * 75);
      } else if (itemGroup.category === 'Entertainment') {
        amount = 12 + Math.floor(Math.random() * 35);
      }

      transactions.push({
        type: 'expense',
        amount,
        category: itemGroup.category,
        date: format(dateDay, 'yyyy-MM-dd'),
        notes: notesSelected,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      });
    }
  }

  await db.transactions.bulkAdd(transactions);
};
