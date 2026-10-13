const API_BASE = window.location.origin;
// Browser storage that never throws (private mode, blocked cookies, some in-app browsers).
// Falls back to memory so the store keeps working for the current page visit.
function createSafeStorage(kind) {
  const memory = {};
  let store = null;
  try {
    store = window[kind];
    const probe = '__km_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
  } catch (error) {
    store = null;
  }
  return {
    getItem(key) {
      try { if (store) return store.getItem(key); } catch (error) { /* use memory */ }
      return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null;
    },
    setItem(key, value) {
      try { if (store) { store.setItem(key, String(value)); return; } } catch (error) { /* use memory */ }
      memory[key] = String(value);
    },
    removeItem(key) {
      try { if (store) store.removeItem(key); } catch (error) { /* ignore */ }
      delete memory[key];
    }
  };
}
const LS = createSafeStorage('localStorage');
const SS = createSafeStorage('sessionStorage');

const CART_KEY = 'km_cart';
const BUY_NOW_KEY = 'km_buy_now';
const USER_KEY = 'km_user';
const ORDERS_KEY = 'km_orders';
const ADMIN_TOKEN_KEY = 'km_admin_token';
const ADMIN_EMAIL_KEY = 'km_admin_email';
const CUSTOMER_TOKEN_KEY = 'km_customer_token';
const LANGUAGE_KEY = 'km_language';
const LANGUAGE_PROMPT_KEY = 'km_language_prompt_shown';

const KN_TRANSLATIONS = {
  Home: 'ಮುಖಪುಟ',
  Orders: 'ಆರ್ಡರ್‌ಗಳು',
  Login: 'ಲಾಗಿನ್',
  Admin: 'ನಿರ್ವಾಹಕ',
  Profile: 'ಪ್ರೊಫೈಲ್',
  Menu: 'ಮೆನು',
  'My profile': 'ನನ್ನ ಪ್ರೊಫೈಲ್',
  Contact: 'ಸಂಪರ್ಕಿಸಿ',
  FAQs: 'ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳು',
  'Contact us': 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ',
  'For help with shopping or orders, call our store:': 'ಖರೀದಿ ಅಥವಾ ಆರ್ಡರ್‌ಗಳ ಸಹಾಯಕ್ಕಾಗಿ ನಮ್ಮ ಅಂಗಡಿಗೆ ಕರೆಮಾಡಿ:',
  '91+ 0000000000': '91+ 0000000000',
  'Frequently asked questions': 'ಪದೇ ಪದೇ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು',
  'How do I place an order?': 'ನಾನು ಆರ್ಡರ್ ಹೇಗೆ ಮಾಡುವುದು?',
  'Add items to your cart, then continue to checkout and submit your delivery details.': 'ವಸ್ತುಗಳನ್ನು ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ, ಚೆಕ್‌ಔಟ್‌ಗೆ ಮುಂದುವರಿದು ವಿತರಣಾ ವಿವರಗಳನ್ನು ಸಲ್ಲಿಸಿ.',
  'What payment methods are available?': 'ಯಾವ ಪಾವತಿ ವಿಧಾನಗಳು ಲಭ್ಯವಿವೆ?',
  'Choose Cash on Delivery or UPI at checkout.': 'ಚೆಕ್‌ಔಟ್‌ನಲ್ಲಿ ವಿತರಣೆ ವೇಳೆ ನಗದು ಅಥವಾ UPI ಆಯ್ಕೆಮಾಡಿ.',
  'Can I cancel an order?': 'ನಾನು ಆರ್ಡರ್ ರದ್ದುಮಾಡಬಹುದೇ?',
  'You can cancel a confirmed order from Orders within two minutes after placing it.': 'ಆರ್ಡರ್ ಮಾಡಿದ ಎರಡು ನಿಮಿಷಗಳೊಳಗೆ ಆರ್ಡರ್‌ಗಳ ಪುಟದಿಂದ ದೃಢೀಕರಿಸಿದ ಆರ್ಡರ್ ರದ್ದುಮಾಡಬಹುದು.',
  'How much is delivery?': 'ವಿತರಣಾ ಶುಲ್ಕ ಎಷ್ಟು?',
  'Delivery is free for orders of ₹199 or more; otherwise the fee is ₹25.': '₹199 ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಆರ್ಡರ್‌ಗಳಿಗೆ ಉಚಿತ ವಿತರಣೆ; ಇಲ್ಲದಿದ್ದರೆ ಶುಲ್ಕ ₹25.',
  'Fresh groceries at your doorstep': 'ತಾಜಾ ದಿನಸಿ ನಿಮ್ಮ ಮನೆಬಾಗಿಲಿಗೆ',
  'Everything your kitchen needs, delivered fast.': 'ನಿಮ್ಮ ಅಡುಗೆಮನೆಗೆ ಬೇಕಾದ ಎಲ್ಲವೂ, 20 ನಿಮಿಷಗಳಲ್ಲಿ ಮನೆಗೆ ತಲುಪಿಸಲಾಗುತ್ತದೆ.',
  'Shop staples, dairy, fruits, snacks and household essentials with same-day delivery in your city.': 'ದಿನಸಿ, ಹಾಲಿನ ಉತ್ಪನ್ನಗಳು, ಹಣ್ಣುಗಳು, ತಿಂಡಿಗಳು ಮತ್ತು ಗೃಹೋಪಯೋಗಿ ವಸ್ತುಗಳನ್ನು ಅದೇ ದಿನದ ವಿತರಣೆಯೊಂದಿಗೆ ಖರೀದಿಸಿ.',
  'Go to cart': 'ಕಾರ್ಟ್‌ಗೆ ಹೋಗಿ',
  'View orders': 'ಆರ್ಡರ್‌ಗಳನ್ನು ನೋಡಿ',
  'Why shop with us?': 'ನಮ್ಮಲ್ಲಿ ಏಕೆ ಖರೀದಿಸಬೇಕು?',
  'Fresh Picks': 'ತಾಜಾ ಆಯ್ಕೆಗಳು',
  'Welcome to': 'ಸ್ವಾಗತ',
  'Welcome to Kamagere-Mart': 'ಕಾಮಗೆರೆ ಮಾರ್ಟ್‌ಗೆ ಸ್ವಾಗತ',
  'Total saved': 'ಒಟ್ಟು ಉಳಿತಾಯ',
  'Delivery within 20 mins': '20 ನಿಮಿಷಗಳಲ್ಲಿ ವಿತರಣೆ',
  'Shop by Category': 'ವರ್ಗದ ಪ್ರಕಾರ ಖರೀದಿಸಿ',
  'View All': 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ',
  'Fresh Items': 'ತಾಜಾ ವಸ್ತುಗಳು',
  'Fruits, vegetables & meat': 'ಹಣ್ಣುಗಳು, ತರಕಾರಿಗಳು ಮತ್ತು ಮಾಂಸ',
  'Fruits': 'ಹಣ್ಣುಗಳು',
  'Vegetables': 'ತರಕಾರಿಗಳು',
  'Meat': 'ಮಾಂಸ',
  'Atta & Rice': 'ಹಿಟ್ಟು ಮತ್ತು ಅಕ್ಕಿ',
  'Flour, rice & grains': 'ಹಿಟ್ಟು, ಅಕ್ಕಿ ಮತ್ತು ಧಾನ್ಯಗಳು',
  'Dairy & Eggs': 'ಹಾಲಿನ ಉತ್ಪನ್ನಗಳು ಮತ್ತು ಮೊಟ್ಟೆಗಳು',
  'Milk, butter, curd & eggs': 'ಹಾಲು, ಬೆಣ್ಣೆ, ಮೊಸರು ಮತ್ತು ಮೊಟ್ಟೆಗಳು',
  'Cooking Essentials': 'ಅಡುಗೆ ಅಗತ್ಯ ವಸ್ತುಗಳು',
  'Oil, salt & daily staples': 'ಎಣ್ಣೆ, ಉಪ್ಪು ಮತ್ತು ದಿನನಿತ್ಯದ ಅಗತ್ಯ ವಸ್ತುಗಳು',
  'Snacks & Biscuits': 'ತಿಂಡಿಗಳು ಮತ್ತು ಬಿಸ್ಕತ್ತುಗಳು',
  'Biscuits, noodles & munchies': 'ಬಿಸ್ಕತ್ತುಗಳು, ನೂಡಲ್ಸ್ ಮತ್ತು ತಿಂಡಿಗಳು',
  'Household': 'ಗೃಹೋಪಯೋಗಿ ವಸ್ತುಗಳು',
  'Cleaning & home essentials': 'ಸ್ವಚ್ಛತೆ ಮತ್ತು ಮನೆಯ ಅಗತ್ಯ ವಸ್ತುಗಳು',
  'Dairy': 'ಹಾಲಿನ ಉತ್ಪನ್ನಗಳು',
  'Staples': 'ದಿನಸಿ ಅಗತ್ಯ ವಸ್ತುಗಳು',
  'Cooking Oil': 'ಅಡುಗೆ ಎಣ್ಣೆ',
  'Snacks': 'ತಿಂಡಿಗಳು',
  'Aashirvaad Atta': 'ಆಶೀರ್ವಾದ್ ಆಟ್ಟಾ',
  'India Gate Basmati Rice': 'ಇಂಡಿಯಾ ಗೇಟ್ ಬಾಸ್ಮತಿ ಅಕ್ಕಿ',
  'Nandini Toned Milk': 'ನಂದಿನಿ ಟೋನ್ಡ್ ಹಾಲು',
  'Amul Butter': 'ಅಮುಲ್ ಬೆಣ್ಣೆ',
  'Tata Salt': 'ಟಾಟಾ ಉಪ್ಪು',
  'Fortune Sunflower Oil': 'ಫಾರ್ಚೂನ್ ಸೂರ್ಯಕಾಂತಿ ಎಣ್ಣೆ',
  'Maggi Noodles': 'ಮ್ಯಾಗಿ ನೂಡಲ್ಸ್',
  'Parle-G Biscuits': 'ಪಾರ್ಲೆ-ಜಿ ಬಿಸ್ಕತ್ತುಗಳು',
  'Banana': 'ಬಾಳೆಹಣ್ಣು',
  'Tomato': 'ಟೊಮೇಟೊ',
  'Onion': 'ಈರುಳ್ಳಿ',
  'Surf Excel': 'ಸರ್ಫ್ ಎಕ್ಸೆಲ್',
  'Milky Mist Paneer': 'ಮಿಲ್ಕಿ ಮಿಸ್ಟ್ ಪನೀರ್',
  'Sunpure Refined Sunflower Oil': 'ಸನ್‌ಪ್ಯೂರ್ ಶುದ್ಧೀಕರಿಸಿದ ಸೂರ್ಯಕಾಂತಿ ಎಣ್ಣೆ',
  'Daawat Rozana Basmati Rice Gold': 'ದಾವತ್ ರೋಜಾನಾ ಬಾಸ್ಮತಿ ಅಕ್ಕಿ ಗೋಲ್ಡ್',
  'Madhur Sugar': 'ಮಧುರ್ ಸಕ್ಕರೆ',
  "Haldiram's Aloo Bhujia": 'ಹಲ್ದೀರಾಮ್ಸ್ ಆಲೂ ಭುಜಿಯಾ',
  'Cadbury Dairy Milk Silk Mousse': 'ಕ್ಯಾಡ್ಬರಿ ಡೈರಿ ಮಿಲ್ಕ್ ಸಿಲ್ಕ್ ಮೌಸ್',
  'Cadbery Dairy Milk Silk bubbly': 'ಕ್ಯಾಡ್ಬರಿ ಡೈರಿ ಮಿಲ್ಕ್ ಸಿಲ್ಕ್ ಬಬ್ಲಿ',
  'Cadbury Dairy Milk Silk Bubbly': 'ಕ್ಯಾಡ್ಬರಿ ಡೈರಿ ಮಿಲ್ಕ್ ಸಿಲ್ಕ್ ಬಬ್ಲಿ',
  'Daily good Sugar': 'ಡೈಲಿ ಗುಡ್ ಸಕ್ಕರೆ',
  'Daily Good Sugar': 'ಡೈಲಿ ಗುಡ್ ಸಕ್ಕರೆ',
  'Daily Good Sugar is a retail brand of packaged white and refined sugar widely available on online grocery delivery platforms in India': 'ಡೈಲಿ ಗುಡ್ ಸಕ್ಕರೆ ಭಾರತದಲ್ಲಿನ ಆನ್‌ಲೈನ್ ದಿನಸಿ ವಿತರಣಾ ವೇದಿಕೆಗಳಲ್ಲಿ ವ್ಯಾಪಕವಾಗಿ ಲಭ್ಯವಿರುವ ಪ್ಯಾಕ್ ಮಾಡಿದ ಬಿಳಿ ಮತ್ತು ಸಂಸ್ಕರಿಸಿದ ಸಕ್ಕರೆಯ ಬ್ರ್ಯಾಂಡ್ ಆಗಿದೆ.',
  'Dettol Foaming Handwash Pump': 'ಡೆಟ್ಟಾಲ್ ನೊರೆಯ ಹ್ಯಾಂಡ್‌ವಾಶ್ ಪಂಪ್',
  'Dettol Foaming Handwash Pump - Strawberry, 250ml | Rich Foam | Moisturizing Hand Wash | Soft on Hands': 'ಡೆಟ್ಟಾಲ್ ಸ್ಟ್ರಾಬೆರಿ ಸುವಾಸನೆಯ ನೊರೆಯ ಹ್ಯಾಂಡ್‌ವಾಶ್ ಪಂಪ್ - 250 ಮಿ.ಲೀ. | ಸಮೃದ್ಧ ನೊರೆ | ತೇವಾಂಶ ಕಾಪಾಡುವ ಹ್ಯಾಂಡ್ ವಾಶ್ | ಕೈಗಳಿಗೆ ಮೃದು.',
  'Aashirvaad Atta made from quality wheat. Suitable for everyday chapati and roti preparation.': 'ಗುಣಮಟ್ಟದ ಗೋಧಿಯಿಂದ ತಯಾರಿಸಿದ ಆಶೀರ್ವಾದ್ ಆಟ್ಟಾ. ಪ್ರತಿದಿನದ ಚಪಾತಿ ಮತ್ತು ರೊಟ್ಟಿ ತಯಾರಿಸಲು ಸೂಕ್ತ.',
  'Premium quality basmati rice with long grains and a pleasant aroma, suitable for biryani, pulao and everyday meals.': 'ಉದ್ದನೆಯ ಕಾಳುಗಳು ಮತ್ತು ಆಹ್ಲಾದಕರ ಪರಿಮಳವಿರುವ ಉತ್ತಮ ಗುಣಮಟ್ಟದ ಬಾಸ್ಮತಿ ಅಕ್ಕಿ. ಬಿರಿಯಾನಿ, ಪುಲಾವ್ ಮತ್ತು ದಿನನಿತ್ಯದ ಊಟಕ್ಕೆ ಸೂಕ್ತ.',
  'Fresh toned milk suitable for drinking, tea, coffee, cooking and everyday household use.': 'ಕುಡಿಯಲು, ಚಹಾ, ಕಾಫಿ, ಅಡುಗೆ ಮತ್ತು ದಿನನಿತ್ಯದ ಮನೆಯ ಬಳಕೆಗೆ ಸೂಕ್ತವಾದ ತಾಜಾ ಟೋನ್ಡ್ ಹಾಲು.',
  'Amul butter with a rich and creamy taste, suitable for breakfast, cooking, baking and snacks.': 'ಸಮೃದ್ಧವಾದ ಕೆನೆಯ ರುಚಿಯ ಅಮುಲ್ ಬೆಣ್ಣೆ. ಉಪಾಹಾರ, ಅಡುಗೆ, ಬೇಕಿಂಗ್ ಮತ್ತು ತಿಂಡಿಗಳಿಗೆ ಸೂಕ್ತ.',
  'Iodised salt for everyday cooking and household food preparation.': 'ದಿನನಿತ್ಯದ ಅಡುಗೆ ಮತ್ತು ಮನೆಯ ಆಹಾರ ತಯಾರಿಕೆಗೆ ಅಯೋಡಿನ್‌ಯುಕ್ತ ಉಪ್ಪು.',
  'Sunflower cooking oil suitable for everyday frying, cooking and food preparation.': 'ದಿನನಿತ್ಯದ ಕರಿಯಲು, ಅಡುಗೆಗೆ ಮತ್ತು ಆಹಾರ ತಯಾರಿಕೆಗೆ ಸೂಕ್ತವಾದ ಸೂರ್ಯಕಾಂತಿ ಅಡುಗೆ ಎಣ್ಣೆ.',
  'Instant noodles that are quick and easy to prepare for a convenient snack or meal.': 'ತ್ವರಿತವಾಗಿ ಮತ್ತು ಸುಲಭವಾಗಿ ತಯಾರಿಸಬಹುದಾದ ಇನ್‌ಸ್ಟಂಟ್ ನೂಡಲ್ಸ್; ತಕ್ಷಣದ ತಿಂಡಿ ಅಥವಾ ಊಟಕ್ಕೆ ಸೂಕ್ತ.',
  'Classic glucose biscuits suitable for tea time, snacks and everyday family consumption.': 'ಚಹಾ ಸಮಯ, ತಿಂಡಿ ಮತ್ತು ಕುಟುಂಬದ ದಿನನಿತ್ಯದ ಸೇವನೆಗೆ ಸೂಕ್ತವಾದ ಕ್ಲಾಸಿಕ್ ಗ್ಲೂಕೋಸ್ ಬಿಸ್ಕತ್ತುಗಳು.',
  'Fresh bananas suitable for everyday consumption, breakfast and snacks.': 'ದಿನನಿತ್ಯ ತಿನ್ನಲು, ಉಪಾಹಾರಕ್ಕೆ ಮತ್ತು ತಿಂಡಿಗೆ ಸೂಕ್ತವಾದ ತಾಜಾ ಬಾಳೆಹಣ್ಣುಗಳು.',
  'Fresh tomatoes suitable for curries, sambar, rasam, salads and everyday cooking.': 'ಪಲ್ಯ, ಸಾಂಬಾರ್, ರಸಂ, ಸಲಾಡ್ ಮತ್ತು ದಿನನಿತ್ಯದ ಅಡುಗೆಗೆ ಸೂಕ್ತವಾದ ತಾಜಾ ಟೊಮೇಟೊಗಳು.',
  'Fresh onions suitable for everyday cooking, curries, biryani and salads.': 'ದಿನನಿತ್ಯದ ಅಡುಗೆ, ಪಲ್ಯ, ಬಿರಿಯಾನಿ ಮತ್ತು ಸಲಾಡ್‌ಗೆ ಸೂಕ್ತವಾದ ತಾಜಾ ಈರುಳ್ಳಿ.',
  'Laundry detergent suitable for everyday washing and household cleaning.': 'ದಿನನಿತ್ಯದ ಬಟ್ಟೆ ತೊಳೆಯಲು ಮತ್ತು ಮನೆಯ ಸ್ವಚ್ಛತೆಗೆ ಸೂಕ್ತವಾದ ಡಿಟರ್ಜೆಂಟ್.',
  'Fresh and soft paneer suitable for curries, snacks, gravies and everyday cooking.': 'ಪಲ್ಯ, ತಿಂಡಿ, ಗ್ರೇವಿ ಮತ್ತು ದಿನನಿತ್ಯದ ಅಡುಗೆಗೆ ಸೂಕ್ತವಾದ ತಾಜಾ ಮೃದುವಾದ ಪನೀರ್.',
  'Refined sunflower oil suitable for frying, cooking and everyday food preparation.': 'ಕರಿಯಲು, ಅಡುಗೆಗೆ ಮತ್ತು ದಿನನಿತ್ಯದ ಆಹಾರ ತಯಾರಿಕೆಗೆ ಸೂಕ್ತವಾದ ಶುದ್ಧೀಕರಿಸಿದ ಸೂರ್ಯಕಾಂತಿ ಎಣ್ಣೆ.',
  'Premium basmati rice with long and aromatic grains, suitable for biryani, pulao and everyday meals': 'ಉದ್ದನೆಯ ಪರಿಮಳಯುಕ್ತ ಕಾಳುಗಳಿರುವ ಉತ್ತಮ ಗುಣಮಟ್ಟದ ಬಾಸ್ಮತಿ ಅಕ್ಕಿ. ಬಿರಿಯಾನಿ, ಪುಲಾವ್ ಮತ್ತು ದಿನನಿತ್ಯದ ಊಟಕ್ಕೆ ಸೂಕ್ತ.',
  'Whole wheat atta suitable for preparing soft chapatis, rotis and everyday Indian meals': 'ಮೃದುವಾದ ಚಪಾತಿ, ರೊಟ್ಟಿ ಮತ್ತು ದಿನನಿತ್ಯದ ಭಾರತೀಯ ಊಟ ತಯಾರಿಸಲು ಸೂಕ್ತವಾದ ಸಂಪೂರ್ಣ ಗೋಧಿ ಹಿಟ್ಟು.',
  "Crispy and spicy aloo bhujia snack, suitable for tea-time and everyday snacking.": 'ಚಹಾ ಸಮಯ ಮತ್ತು ದಿನನಿತ್ಯದ ತಿಂಡಿಗೆ ಸೂಕ್ತವಾದ ಕುರುಕುರಿಯಾದ ಖಾರ ಆಲೂ ಭುಜಿಯಾ.',
  'Smooth and creamy milk chocolate with a rich mousse center suitable for a delicious sweet': 'ರುಚಿಕರವಾದ ಸಿಹಿಗಾಗಿ ಸಮೃದ್ಧ ಮೌಸ್ ಒಳಭಾಗವಿರುವ ಮೃದುವಾದ, ಕೆನೆಯಂತಹ ಹಾಲಿನ ಚಾಕೊಲೇಟ್.',
  'melting chocolate': 'ಕರಗುವ ಚಾಕೊಲೇಟ್',
  'Choose a category to find your daily essentials quickly.': 'ನಿಮ್ಮ ದೈನಂದಿನ ಅಗತ್ಯ ವಸ್ತುಗಳನ್ನು ಬೇಗನೆ ಹುಡುಕಲು ವರ್ಗವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
  'View All': 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ',
  'Search vegetables, dairy, atta...': 'ತರಕಾರಿಗಳು, ಹಾಲಿನ ಉತ್ಪನ್ನಗಳು, ಹಿಟ್ಟು ಹುಡುಕಿ...',
  'All products': 'ಎಲ್ಲಾ ಉತ್ಪನ್ನಗಳು',
  'Fresh Items': 'ತಾಜಾ ವಸ್ತುಗಳು',
  'Fruits, vegetables & meat': 'ಹಣ್ಣುಗಳು, ತರಕಾರಿಗಳು ಮತ್ತು ಮಾಂಸ',
  'Flour, rice & grains': 'ಹಿಟ್ಟು, ಅಕ್ಕಿ ಮತ್ತು ಧಾನ್ಯಗಳು',
  'Dairy & Eggs': 'ಹಾಲಿನ ಉತ್ಪನ್ನಗಳು ಮತ್ತು ಮೊಟ್ಟೆಗಳು',
  'Milk, butter, curd & eggs': 'ಹಾಲು, ಬೆಣ್ಣೆ, ಮೊಸರು ಮತ್ತು ಮೊಟ್ಟೆಗಳು',
  'Cooking Essentials': 'ಅಡುಗೆ ಅಗತ್ಯ ವಸ್ತುಗಳು',
  'Oil, salt & daily staples': 'ಎಣ್ಣೆ, ಉಪ್ಪು ಮತ್ತು ದಿನಸಿ ಸಾಮಗ್ರಿಗಳು',
  'Snacks & Biscuits': 'ತಿಂಡಿಗಳು ಮತ್ತು ಬಿಸ್ಕತ್ತುಗಳು',
  'Biscuits, noodles & munchies': 'ಬಿಸ್ಕತ್ತುಗಳು, ನೂಡಲ್ಸ್ ಮತ್ತು ತಿಂಡಿಗಳು',
  'Cleaning & home essentials': 'ಸ್ವಚ್ಛತೆ ಮತ್ತು ಮನೆಯ ಅಗತ್ಯ ವಸ್ತುಗಳು',
  Meat: 'ಮಾಂಸ',
  '1 dozen': 'ಒಂದು ಡಜನ್',
  'Shop staples, dairy, fruits, snacks and household essentials with delivery within 20 minutes.': 'ದಿನಸಿ, ಹಾಲಿನ ಉತ್ಪನ್ನಗಳು, ಹಣ್ಣುಗಳು, ತಿಂಡಿಗಳು ಮತ್ತು ಗೃಹೋಪಯೋಗಿ ವಸ್ತುಗಳನ್ನು 20 ನಿಮಿಷಗಳಲ್ಲಿ ವಿತರಣೆಯೊಂದಿಗೆ ಖರೀದಿಸಿ.',
  'Thanks for placing your order!': 'ಆರ್ಡರ್ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು!',
  'Your order is confirmed and will reach you within 20 minutes.': 'ನಿಮ್ಮ ಆರ್ಡರ್ ದೃಢಪಟ್ಟಿದೆ ಮತ್ತು 20 ನಿಮಿಷಗಳಲ್ಲಿ ನಿಮ್ಮನ್ನು ತಲುಪುತ್ತದೆ.',
  'Continue shopping': 'ಖರೀದಿ ಮುಂದುವರಿಸಿ',
  Cart: 'ಕಾರ್ಟ್',
  Delivery: 'ವಿತರಣೆ',
  Offers: 'ಆಫರ್‌ಗಳು',
  Saved: 'ಉಳಿತಾಯ',
  'Best Deals': 'ಅತ್ಯುತ್ತಮ ಆಫರ್‌ಗಳು',
  'Save on every order': 'ಪ್ರತಿ ಆರ್ಡರ್‌ನಲ್ಲೂ ಉಳಿತಾಯ',
  'Up to 30%': '30% ವರೆಗೆ',
  'Add to cart': 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
  'Buy now': 'ಈಗಲೇ ಖರೀದಿಸಿ',
  'Your cart': 'ನಿಮ್ಮ ಕಾರ್ಟ್',
  'Continue shopping': 'ಖರೀದಿ ಮುಂದುವರಿಸಿ',
  'Proceed to checkout': 'ಚೆಕ್‌ಔಟ್‌ಗೆ ಮುಂದುವರಿಯಿರಿ',
  'Your cart is empty.': 'ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ.',
  Subtotal: 'ಉಪಮೊತ್ತ',
  Total: 'ಒಟ್ಟು',
  'Delivery fee': 'ವಿತರಣಾ ಶುಲ್ಕ',
  'Free delivery on orders of ₹199 or more; otherwise ₹25.': '₹199 ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಆರ್ಡರ್‌ಗಳಿಗೆ ಉಚಿತ ವಿತರಣೆ; ಇಲ್ಲದಿದ್ದರೆ ₹25.',
  Checkout: 'ಚೆಕ್‌ಔಟ್',
  'Delivery address': 'ವಿತರಣಾ ವಿಳಾಸ',
  'Use my current location': 'ನನ್ನ ಪ್ರಸ್ತುತ ಸ್ಥಳ ಬಳಸಿ',
  'Payment method': 'ಪಾವತಿ ವಿಧಾನ',
  'Place order': 'ಆರ್ಡರ್ ಮಾಡಿ',
  'Cash on delivery': 'ವಿತರಣೆ ವೇಳೆ ನಗದು',
  'Order placed successfully': 'ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ಮಾಡಲಾಗಿದೆ',
  'Order history': 'ಆರ್ಡರ್ ಇತಿಹಾಸ',
  'No orders yet.': 'ಇನ್ನೂ ಯಾವುದೇ ಆರ್ಡರ್‌ಗಳಿಲ್ಲ.',
  'Order details': 'ಆರ್ಡರ್ ವಿವರಗಳು',
  'Track order': 'ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
  'Order tracking': 'ಆರ್ಡರ್ ಟ್ರ್ಯಾಕಿಂಗ್',
  'Open delivery route in Google Maps': 'Google Maps‌ನಲ್ಲಿ ವಿತರಣಾ ಮಾರ್ಗ ತೆರೆಯಿರಿ',
  'Share tracking': 'ಟ್ರ್ಯಾಕಿಂಗ್ ಹಂಚಿಕೊಳ್ಳಿ',
  'Delivery route from store to your address.': 'ಅಂಗಡಿಯಿಂದ ನಿಮ್ಮ ವಿಳಾಸದವರೆಗಿನ ವಿತರಣಾ ಮಾರ್ಗ.',
  'Open the route in Google Maps to view turn-by-turn directions.': 'ಹಂತ ಹಂತದ ದಿಕ್ಕುಗಳನ್ನು ನೋಡಲು Google Maps‌ನಲ್ಲಿ ಮಾರ್ಗ ತೆರೆಯಿರಿ.',
  'Store location': 'ಅಂಗಡಿಯ ಸ್ಥಳ',
  'Store address used for delivery directions': 'ವಿತರಣಾ ಮಾರ್ಗಗಳಿಗೆ ಬಳಸುವ ಅಂಗಡಿ ವಿಳಾಸ',
  'Save store location': 'ಅಂಗಡಿ ಸ್ಥಳವನ್ನು ಉಳಿಸಿ',
  'Store location updated.': 'ಅಂಗಡಿಯ ಸ್ಥಳ ನವೀಕರಿಸಲಾಗಿದೆ.',
  'Update status': 'ಸ್ಥಿತಿ ನವೀಕರಿಸಿ',
  'Unable to update order status.': 'ಆರ್ಡರ್ ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  Cancel: 'ರದ್ದುಮಾಡಿ',
  'Cancel order': 'ಆರ್ಡರ್ ರದ್ದುಮಾಡಿ',
  'My profile': 'ನನ್ನ ಪ್ರೊಫೈಲ್',
  Name: 'ಹೆಸರು',
  Email: 'ಇಮೇಲ್',
  Phone: 'ಫೋನ್',
  Address: 'ವಿಳಾಸ',
  Logout: 'ಲಾಗ್‌ಔಟ್',
  'Login successful': 'ಲಾಗಿನ್ ಯಶಸ್ವಿಯಾಗಿದೆ',
  'Registration successful': 'ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ',
  'Create account': 'ಖಾತೆ ರಚಿಸಿ',
  'Customer benefits': 'ಗ್ರಾಹಕರ ಪ್ರಯೋಜನಗಳು',
  'Admin access': 'ನಿರ್ವಾಹಕ ಪ್ರವೇಶ',
  'Admin sign in': 'ನಿರ್ವಾಹಕರಾಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ',
  'Admin email': 'ನಿರ್ವಾಹಕರ ಇಮೇಲ್',
  'Admin password': 'ನಿರ್ವಾಹಕರ ಪಾಸ್‌ವರ್ಡ್',
  'Sign in as admin': 'ನಿರ್ವಾಹಕರಾಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ',
  'Back to customer login': 'ಗ್ರಾಹಕರ ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ',
  'Use this form to access store management.': 'ಅಂಗಡಿ ನಿರ್ವಹಣೆಗೆ ಈ ಫಾರ್ಮ್ ಬಳಸಿ.',
  'Full name': 'ಪೂರ್ಣ ಹೆಸರು',
  Password: 'ಪಾಸ್‌ವರ್ಡ್',
  'Show password': 'ಪಾಸ್‌ವರ್ಡ್ ತೋರಿಸಿ',
  'Hide password': 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆಮಾಡಿ',
  Register: 'ನೋಂದಣಿ ಮಾಡಿ',
  'Need an account? Register': 'ಖಾತೆ ಬೇಕೇ? ನೋಂದಣಿ ಮಾಡಿ',
  'Already have an account?': 'ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?',
  'Already a member? Login': 'ಈಗಾಗಲೇ ಸದಸ್ಯರೇ? ಲಾಗಿನ್ ಮಾಡಿ',
  'Sign in to continue shopping.': 'ಖರೀದಿ ಮುಂದುವರಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.',
  'Track all orders in one place': 'ಎಲ್ಲಾ ಆರ್ಡರ್‌ಗಳನ್ನು ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ ಗಮನಿಸಿ',
  'Save delivery addresses': 'ವಿತರಣಾ ವಿಳಾಸಗಳನ್ನು ಉಳಿಸಿ',
  'Early access to offers and discounts': 'ಆಫರ್‌ಗಳು ಮತ್ತು ರಿಯಾಯಿತಿಗಳಿಗೆ ಮುಂಚಿತ ಪ್ರವೇಶ',
  'Fast checkout for repeated shopping': 'ಮರುಖರೀದಿಗೆ ವೇಗದ ಚೆಕ್‌ಔಟ್',
  'Preferred language': 'ಆದ್ಯತೆಯ ಭಾಷೆ',
  'Edit profile': 'ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಿ',
  'Save changes': 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
  'Change profile photo': 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ ಬದಲಾಯಿಸಿ',
  'Profile photo': 'ಪ್ರೊಫೈಲ್ ಫೋಟೋ',
  'Profile updated successfully.': 'ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ.',
  'Please sign in again to update your profile.': 'ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಲು ದಯವಿಟ್ಟು ಮತ್ತೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.',
  'Choose an image file for your profile photo.': 'ಪ್ರೊಫೈಲ್ ಫೋಟೋಗಾಗಿ ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
  'This photo is too large to upload. Choose a smaller image.': 'ಈ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ತುಂಬಾ ದೊಡ್ಡದಾಗಿದೆ. ಚಿಕ್ಕ ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
  'Choose your preferred language': 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
  'Select a language to continue.': 'ಮುಂದುವರಿಯಲು ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
  'Preferred language: English or Kannada': 'ಆದ್ಯತೆಯ ಭಾಷೆ: ಇಂಗ್ಲಿಷ್ ಅಥವಾ ಕನ್ನಡ',
  English: 'ಇಂಗ್ಲಿಷ್',
  Kannada: 'ಕನ್ನಡ',
  EN: 'ಇಂಗ್ಲಿಷ್',
  'Aashirvaad Atta': 'ಆಶೀರ್ವಾದ್ ಗೋಧಿ ಹಿಟ್ಟು',
  'India Gate Basmati Rice': 'ಇಂಡಿಯಾ ಗೇಟ್ ಬಾಸ್ಮತಿ ಅಕ್ಕಿ',
  'Nandini Toned Milk': 'ನಂದಿನಿ ಟೋನ್ಡ್ ಹಾಲು',
  'Amul Butter': 'ಅಮೂಲ್ ಬೆಣ್ಣೆ',
  'Tata Salt': 'ಟಾಟಾ ಉಪ್ಪು',
  'Fortune Sunflower Oil': 'ಫಾರ್ಚೂನ್ ಸೂರ್ಯಕಾಂತಿ ಎಣ್ಣೆ',
  'Maggi Noodles': 'ಮ್ಯಾಗಿ ನೂಡಲ್ಸ್',
  'Parle-G Biscuits': 'ಪಾರ್ಲೆ-ಜಿ ಬಿಸ್ಕತ್ತು',
  Banana: 'ಬಾಳೆಹಣ್ಣು',
  Tomato: 'ಟೊಮೇಟೊ',
  Onion: 'ಈರುಳ್ಳಿ',
  'Surf Excel': 'ಸರ್ಫ್ ಎಕ್ಸೆಲ್',
  'Aashirvaad Atta made from quality wheat. Suitable for everyday chapati and roti preparation.': 'ಗುಣಮಟ್ಟದ ಗೋಧಿಯಿಂದ ತಯಾರಿಸಿದ ಆಶೀರ್ವಾದ್ ಹಿಟ್ಟು. ಪ್ರತಿದಿನದ ಚಪಾತಿ ಮತ್ತು ರೊಟ್ಟಿ ತಯಾರಿಸಲು ಸೂಕ್ತವಾಗಿದೆ.',
  'Premium quality basmati rice with long grains and a pleasant aroma, suitable for biryani, pulao and everyday meals.': 'ಉದ್ದನೆಯ ಕಾಳುಗಳು ಮತ್ತು ಸುವಾಸನೆಯುಳ್ಳ ಪ್ರೀಮಿಯಂ ಗುಣಮಟ್ಟದ ಬಾಸ್ಮತಿ ಅಕ್ಕಿ. ಬಿರಿಯಾನಿ, ಪುಲಾವ್ ಮತ್ತು ದೈನಂದಿನ ಊಟಕ್ಕೆ ಸೂಕ್ತವಾಗಿದೆ.',
  'Fresh toned milk suitable for drinking, tea, coffee, cooking and everyday household use.': 'ಕುಡಿಯಲು, ಚಹಾ, ಕಾಫಿ, ಅಡುಗೆ ಮತ್ತು ದೈನಂದಿನ ಬಳಕೆಗೆ ಸೂಕ್ತವಾದ ತಾಜಾ ಟೋನ್ಡ್ ಹಾಲು.',
  'Amul butter with a rich and creamy taste, suitable for breakfast, cooking, baking and snacks.': 'ರುಚಿಕರವಾದ ಮತ್ತು ಕೆನೆಭರಿತ ಅಮೂಲ್ ಬೆಣ್ಣೆ. ಉಪಾಹಾರ, ಅಡುಗೆ, ಬೇಕಿಂಗ್ ಮತ್ತು ತಿಂಡಿಗಳಿಗೆ ಸೂಕ್ತವಾಗಿದೆ.',
  'Iodised salt for everyday cooking and household food preparation.': 'ದೈನಂದಿನ ಅಡುಗೆ ಮತ್ತು ಆಹಾರ ತಯಾರಿಕೆಗೆ ಅಯೋಡಿನ್ ಹೊಂದಿರುವ ಉಪ್ಪು.',
  'Sunflower cooking oil suitable for everyday frying, cooking and food preparation.': 'ದೈನಂದಿನ ಕರಿಯಲು, ಅಡುಗೆಗೆ ಮತ್ತು ಆಹಾರ ತಯಾರಿಕೆಗೆ ಸೂಕ್ತವಾದ ಸೂರ್ಯಕಾಂತಿ ಎಣ್ಣೆ.',
  'Instant noodles that are quick and easy to prepare for a convenient snack or meal.': 'ತ್ವರಿತವಾಗಿ ಮತ್ತು ಸುಲಭವಾಗಿ ತಯಾರಿಸಬಹುದಾದ ನೂಡಲ್ಸ್; ಲಘು ಆಹಾರ ಅಥವಾ ಊಟಕ್ಕೆ ಸೂಕ್ತವಾಗಿದೆ.',
  'Classic glucose biscuits suitable for tea time, snacks and everyday family consumption.': 'ಚಹಾ ಸಮಯ, ತಿಂಡಿ ಮತ್ತು ಕುಟುಂಬದ ದೈನಂದಿನ ಬಳಕೆಗೆ ಸೂಕ್ತವಾದ ಗ್ಲೂಕೋಸ್ ಬಿಸ್ಕತ್ತುಗಳು.',
  'Fresh bananas suitable for everyday consumption, breakfast and snacks.': 'ದೈನಂದಿನ ಸೇವನೆ, ಉಪಾಹಾರ ಮತ್ತು ತಿಂಡಿಗೆ ಸೂಕ್ತವಾದ ತಾಜಾ ಬಾಳೆಹಣ್ಣುಗಳು.',
  'Fresh tomatoes suitable for curries, sambar, rasam, salads and everyday cooking.': 'ಪಲ್ಯ, ಸಾಂಬಾರ್, ರಸಂ, ಸಲಾಡ್ ಮತ್ತು ದೈನಂದಿನ ಅಡುಗೆಗೆ ಸೂಕ್ತವಾದ ತಾಜಾ ಟೊಮೇಟೊಗಳು.',
  'Fresh onions suitable for everyday cooking, curries, biryani and salads.': 'ದೈನಂದಿನ ಅಡುಗೆ, ಪಲ್ಯ, ಬಿರಿಯಾನಿ ಮತ್ತು ಸಲಾಡ್‌ಗೆ ಸೂಕ್ತವಾದ ತಾಜಾ ಈರುಳ್ಳಿ.',
  'Laundry detergent suitable for everyday washing and household cleaning.': 'ದೈನಂದಿನ ಬಟ್ಟೆ ಒಗೆಯಲು ಮತ್ತು ಮನೆಯ ಸ್ವಚ್ಛತೆಗೆ ಸೂಕ್ತವಾದ ಬಟ್ಟೆ ತೊಳೆಯುವ ಪುಡಿ.',
  'Atta & Rice': 'ಗೋಧಿ ಹಿಟ್ಟು ಮತ್ತು ಅಕ್ಕಿ',
  Dairy: 'ಹಾಲಿನ ಉತ್ಪನ್ನಗಳು',
  Staples: 'ಅಡುಗೆ ಸಾಮಗ್ರಿಗಳು',
  'Cooking Oil': 'ಅಡುಗೆ ಎಣ್ಣೆ',
  Snacks: 'ತಿಂಡಿಗಳು',
  Fruits: 'ಹಣ್ಣುಗಳು',
  Vegetables: 'ತರಕಾರಿಗಳು',
  Household: 'ಮನೆ ಬಳಕೆಯ ವಸ್ತುಗಳು',
  'Create your account': 'ನಿಮ್ಮ ಖಾತೆ ರಚಿಸಿ',
  'Register for a Kamagere Mart account': 'ಕಾಮಗೆರೆ ಮಾರ್ಟ್ ಖಾತೆಗೆ ನೋಂದಣಿ ಮಾಡಿ',
  'Close': 'ಮುಚ್ಚಿ',
  'Fresh essentials delivered': 'ತಾಜಾ ಅಗತ್ಯ ವಸ್ತುಗಳು ಮನೆಗೆ',
  'All': 'ಎಲ್ಲಾ',
  'Vegetables': 'ತರಕಾರಿಗಳು',
  'Fruits': 'ಹಣ್ಣುಗಳು',
  'Dairy': 'ಹಾಲಿನ ಉತ್ಪನ್ನಗಳು',
  'Atta & Rice': 'ಹಿಟ್ಟು ಮತ್ತು ಅಕ್ಕಿ',
  Staples: 'ದೈನಂದಿನ ಅಗತ್ಯ ವಸ್ತುಗಳು',
  'Cooking Oil': 'ಅಡುಗೆ ಎಣ್ಣೆ',
  'Groceries': 'ದಿನಸಿ',
  'Snacks': 'ತಿಂಡಿಗಳು',
  'Household': 'ಮನೆಯ ಬಳಕೆಯ ವಸ್ತುಗಳು',
  'Loading...': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
  'Something went wrong. Please try again.': 'ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
  'Buy Now': 'ಈಗಲೇ ಖರೀದಿಸಿ',
  'Add to Cart': 'ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ',
  'No products match your search. Try a different keyword or category.': 'ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಯಾವುದೇ ಉತ್ಪನ್ನಗಳು ಹೊಂದಿಕೆಯಾಗಿಲ್ಲ. ಬೇರೆ ಪದ ಅಥವಾ ವರ್ಗವನ್ನು ಪ್ರಯತ್ನಿಸಿ.',
  'Your cart is empty': 'ನಿಮ್ಮ ಕಾರ್ಟ್ ಖಾಲಿಯಾಗಿದೆ',
  'Browse groceries and add items to start your order.': 'ದಿನಸಿ ವಸ್ತುಗಳನ್ನು ನೋಡಿ ಮತ್ತು ಆರ್ಡರ್ ಆರಂಭಿಸಲು ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ.',
  'Shopping cart': 'ಖರೀದಿ ಕಾರ್ಟ್',
  Remove: 'ತೆಗೆದುಹಾಕಿ',
  'No items to checkout': 'ಚೆಕ್‌ಔಟ್ ಮಾಡಲು ಯಾವುದೇ ವಸ್ತುಗಳಿಲ್ಲ',
  'Add products': 'ಉತ್ಪನ್ನಗಳನ್ನು ಸೇರಿಸಿ',
  'Delivery details': 'ವಿತರಣೆಯ ವಿವರಗಳು',
  'Allow location access to show your delivery point on Google Maps.': 'Google Maps‌ನಲ್ಲಿ ನಿಮ್ಮ ವಿತರಣಾ ಸ್ಥಳವನ್ನು ತೋರಿಸಲು ಸ್ಥಳ ಅನುಮತಿ ನೀಡಿ.',
  'Open in Google Maps': 'Google Maps‌ನಲ್ಲಿ ತೆರೆಯಿರಿ',
  'Order source': 'ಆರ್ಡರ್ ಮೂಲ',
  'Order summary': 'ಆರ್ಡರ್ ಸಾರಾಂಶ',
  'Cash on Delivery': 'ವಿತರಣೆ ವೇಳೆ ನಗದು',
  'No orders yet': 'ಇನ್ನೂ ಯಾವುದೇ ಆರ್ಡರ್‌ಗಳಿಲ್ಲ',
  'Place your first order and it will appear here.': 'ನಿಮ್ಮ ಮೊದಲ ಆರ್ಡರ್ ಮಾಡಿ; ಅದು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.',
  'Start shopping': 'ಖರೀದಿ ಪ್ರಾರಂಭಿಸಿ',
  'Could not load admin dashboard': 'ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ',
  'No orders have been placed yet.': 'ಇನ್ನೂ ಯಾವುದೇ ಆರ್ಡರ್‌ಗಳನ್ನು ಮಾಡಿಲ್ಲ.',
  'Sign in': 'ಸೈನ್ ಇನ್',
  'Back to store': 'ಅಂಗಡಿಗೆ ಹಿಂತಿರುಗಿ',
  'Store management': 'ಅಂಗಡಿ ನಿರ್ವಹಣೆ',
  'Admin dashboard': 'ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
  'Sign out': 'ಸೈನ್ ಔಟ್',
  'Total orders': 'ಒಟ್ಟು ಆರ್ಡರ್‌ಗಳು',
  'Order value': 'ಆರ್ಡರ್ ಮೌಲ್ಯ',
  Products: 'ಉತ್ಪನ್ನಗಳು',
  'Add a product': 'ಉತ್ಪನ್ನ ಸೇರಿಸಿ',
  'New products are saved to the store database and appear in the storefront catalog.': 'ಹೊಸ ಉತ್ಪನ್ನಗಳನ್ನು ಅಂಗಡಿ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಉಳಿಸಿ, ಅಂಗಡಿ ಪಟ್ಟಿಯಲ್ಲಿ ತೋರಿಸಲಾಗುತ್ತದೆ.',
  'Product name': 'ಉತ್ಪನ್ನದ ಹೆಸರು',
  Category: 'ವರ್ಗ',
  'Pack size / unit': 'ಪ್ಯಾಕ್ ಗಾತ್ರ / ಘಟಕ',
  'Selling price (₹)': 'ಮಾರಾಟದ ಬೆಲೆ (₹)',
  'MRP (₹)': 'ಗರಿಷ್ಠ ಚಿಲ್ಲರೆ ಬೆಲೆ (₹)',
  Description: 'ವಿವರಣೆ',
  'Image URL (optional, HTTPS)': 'ಚಿತ್ರದ URL (ಐಚ್ಛಿಕ, HTTPS)',
  'Take or choose a product photo': 'ಉತ್ಪನ್ನದ ಫೋಟೋ ತೆಗೆಯಿರಿ ಅಥವಾ ಆಯ್ಕೆಮಾಡಿ',
  'On supported phones this opens the rear camera. Photos are resized before saving.': 'ಬೆಂಬಲಿತ ಫೋನ್‌ಗಳಲ್ಲಿ ಹಿಂಬದಿ ಕ್ಯಾಮೆರಾ ತೆರೆಯುತ್ತದೆ. ಉಳಿಸುವ ಮೊದಲು ಫೋಟೋ ಗಾತ್ರವನ್ನು ಬದಲಾಯಿಸಲಾಗುತ್ತದೆ.',
  'Add product': 'ಉತ್ಪನ್ನ ಸೇರಿಸಿ',
  'Cancel editing': 'ತಿದ್ದುಪಡಿ ರದ್ದುಮಾಡಿ',
  'Store products': 'ಅಂಗಡಿಯ ಉತ್ಪನ್ನಗಳು',
  Edit: 'ತಿದ್ದುಪಡಿ',
  'Recent orders': 'ಇತ್ತೀಚಿನ ಆರ್ಡರ್‌ಗಳು',
  Order: 'ಆರ್ಡರ್',
  Date: 'ದಿನಾಂಕ',
  Items: 'ವಸ್ತುಗಳು',
  Payment: 'ಪಾವತಿ',
  Status: 'ಸ್ಥಿತಿ',
  'Not provided': 'ನೀಡಿಲ್ಲ',
  'You are not logged in': 'ನೀವು ಲಾಗಿನ್ ಆಗಿಲ್ಲ',
  'Sign in to access your account and order history.': 'ನಿಮ್ಮ ಖಾತೆ ಮತ್ತು ಆರ್ಡರ್ ಇತಿಹಾಸ ನೋಡಲು ಸೈನ್ ಇನ್ ಮಾಡಿ.',
  'Order cancelled successfully': 'ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ರದ್ದಾಗಿದೆ',
  'Cancellation window expired': 'ರದ್ದತಿ ಅವಧಿ ಮುಗಿದಿದೆ',
  'Current location selected. Add your house, street, or landmark details above if needed.': 'ಪ್ರಸ್ತುತ ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ. ಬೇಕಾದರೆ ಮನೆ, ರಸ್ತೆ ಅಥವಾ ಗುರುತಿನ ಸ್ಥಳದ ವಿವರ ಸೇರಿಸಿ.',
  'House/flat, street, landmark, city...': 'ಮನೆ/ಫ್ಲಾಟ್, ರಸ್ತೆ, ಗುರುತಿನ ಸ್ಥಳ, ನಗರ...',
  'Unable to update cart.': 'ಕಾರ್ಟ್ ನವೀಕರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  'Unable to load your orders.': 'ನಿಮ್ಮ ಆರ್ಡರ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  'Your admin session expired. Please sign in again.': 'ನಿರ್ವಾಹಕ ಸೆಷನ್ ಮುಗಿದಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.',
  'Could not load orders.': 'ಆರ್ಡರ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  'Could not load products.': 'ಉತ್ಪನ್ನಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  'Unable to cancel order.': 'ಆರ್ಡರ್ ರದ್ದುಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  'Cancellation details are not available for this order': 'ಈ ಆರ್ಡರ್‌ಗೆ ರದ್ದತಿ ವಿವರಗಳು ಲಭ್ಯವಿಲ್ಲ',
  'Unable to connect to the backend API.': 'ಬ್ಯಾಕೆಂಡ್ APIಗೆ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  'Password must be at least 8 characters and contain uppercase, lowercase, number, and special symbol.': 'ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳಿರಬೇಕು ಮತ್ತು ದೊಡ್ಡ ಅಕ್ಷರ, ಸಣ್ಣ ಅಕ್ಷರ, ಸಂಖ್ಯೆ ಹಾಗೂ ವಿಶೇಷ ಚಿಹ್ನೆ ಇರಬೇಕು.',
  'Admin login successful': 'ನಿರ್ವಾಹಕ ಲಾಗಿನ್ ಯಶಸ್ವಿಯಾಗಿದೆ',
  'Invalid email or password.': 'ಇಮೇಲ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ತಪ್ಪಾಗಿದೆ.',
  'Email and password are required.': 'ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಅಗತ್ಯವಿದೆ.',
  'Please fill all required fields': 'ದಯವಿಟ್ಟು ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ತುಂಬಿ',
  'Please enter a valid email address.': 'ದಯವಿಟ್ಟು ಸರಿಯಾದ ಇಮೇಲ್ ವಿಳಾಸ ನಮೂದಿಸಿ.',
  'Please enter a valid 10-digit Indian mobile number.': 'ದಯವಿಟ್ಟು ಸರಿಯಾದ 10 ಅಂಕಿಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.',
  'User already exists': 'ಈ ಬಳಕೆದಾರರು ಈಗಾಗಲೇ ಇದ್ದಾರೆ',
  'Login failed': 'ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ',
  'Registration failed': 'ನೋಂದಣಿ ವಿಫಲವಾಗಿದೆ',
  'Please try again.': 'ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
  'Product photo preview': 'ಉತ್ಪನ್ನದ ಫೋಟೋ ಪೂರ್ವವೀಕ್ಷಣೆ',
  'Email is already registered.': 'ಈ ಇಮೇಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ.',
  'Phone number is already registered.': 'ಈ ಫೋನ್ ಸಂಖ್ಯೆ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ.',
  'This email address and phone number are already registered.': 'ಈ ಇಮೇಲ್ ವಿಳಾಸ ಮತ್ತು ಫೋನ್ ಸಂಖ್ಯೆ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ.',
  'Item': 'ವಸ್ತು',
  'Confirmed': 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
  'Preparing': 'ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ',
  'Out for delivery': 'ವಿತರಣೆಗೆ ಹೊರಟಿದೆ',
  'Delivered': 'ತಲುಪಿಸಲಾಗಿದೆ',
  'Cancelled': 'ರದ್ದಾಗಿದೆ',
  UPI: 'ಯುಪಿಐ',
  COD: 'ವಿತರಣೆ ವೇಳೆ ನಗದು',
  or: 'ಅಥವಾ',
  'Sold out': 'ಸ್ಟಾಕ್ ಖಾಲಿ',
  'Product not available': 'ಉತ್ಪನ್ನ ಲಭ್ಯವಿಲ್ಲ',
  'Out of stock': 'ಸ್ಟಾಕ್ ಇಲ್ಲ',
  'Refresh data': 'ಡೇಟಾ ರಿಫ್ರೆಶ್ ಮಾಡಿ',
  'Restore default products': 'ಡೀಫಾಲ್ಟ್ ಉತ್ಪನ್ನಗಳನ್ನು ಮರುಸ್ಥಾಪಿಸಿ',
  'Update stock': 'ಸ್ಟಾಕ್ ನವೀಕರಿಸಿ',
  Dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
  'Admin login': 'ನಿರ್ವಾಹಕ ಲಾಗಿನ್',
  'Units in stock': 'ಸ್ಟಾಕ್‌ನಲ್ಲಿರುವ ಯೂನಿಟ್‌ಗಳು',
  'Stock quantity': 'ಸ್ಟಾಕ್ ಪ್ರಮಾಣ',
  'Pack size': 'ಪ್ಯಾಕ್ ಗಾತ್ರ',
  Stock: 'ಸ್ಟಾಕ್',
  'Save pack size & stock': 'ಪ್ಯಾಕ್ ಗಾತ್ರ ಮತ್ತು ಸ್ಟಾಕ್ ಉಳಿಸಿ',
  'Set the starting point used for customer delivery routes and Google Maps tracking.': 'ಗ್ರಾಹಕರ ವಿತರಣಾ ಮಾರ್ಗ ಮತ್ತು Google Maps ಟ್ರ್ಯಾಕಿಂಗ್‌ಗೆ ಬಳಸುವ ಆರಂಭಿಕ ಸ್ಥಳವನ್ನು ಹೊಂದಿಸಿ.',
  'Stock drops automatically when customers order. Set a new quantity to restock, or remove a product from the store.': 'ಗ್ರಾಹಕರು ಆರ್ಡರ್ ಮಾಡಿದಾಗ ಸ್ಟಾಕ್ ತಾನಾಗಿ ಕಡಿಮೆಯಾಗುತ್ತದೆ. ಮರುಪೂರೈಕೆಗೆ ಹೊಸ ಪ್ರಮಾಣ ನಮೂದಿಸಿ, ಅಥವಾ ಉತ್ಪನ್ನವನ್ನು ಅಂಗಡಿಯಿಂದ ತೆಗೆದುಹಾಕಿ.',
  'There are no products in the store. Add one above or restore the default products.': 'ಅಂಗಡಿಯಲ್ಲಿ ಯಾವುದೇ ಉತ್ಪನ್ನಗಳಿಲ್ಲ. ಮೇಲೆ ಒಂದನ್ನು ಸೇರಿಸಿ ಅಥವಾ ಡೀಫಾಲ್ಟ್ ಉತ್ಪನ್ನಗಳನ್ನು ಮರುಸ್ಥಾಪಿಸಿ.',
  'Signed in as administrator': 'ನಿರ್ವಾಹಕರಾಗಿ ಸೈನ್ ಇನ್ ಆಗಿದ್ದೀರಿ',
  'You can open any page in the store.': 'ನೀವು ಅಂಗಡಿಯ ಯಾವುದೇ ಪುಟವನ್ನು ತೆರೆಯಬಹುದು.',
  'Some items are sold out or low on stock. Remove them or reduce the quantity to continue.': 'ಕೆಲವು ವಸ್ತುಗಳ ಸ್ಟಾಕ್ ಖಾಲಿಯಾಗಿದೆ ಅಥವಾ ಕಡಿಮೆ ಇದೆ. ಮುಂದುವರಿಯಲು ಅವುಗಳನ್ನು ತೆಗೆದುಹಾಕಿ ಅಥವಾ ಪ್ರಮಾಣ ಕಡಿಮೆ ಮಾಡಿ.',
  'Admin signed out': 'ನಿರ್ವಾಹಕರು ಸೈನ್ ಔಟ್ ಆಗಿದ್ದಾರೆ',
  'Your admin session expired. Please sign in again.': 'ನಿರ್ವಾಹಕ ಸೆಷನ್ ಮುಗಿದಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಸೈನ್ ಇನ್ ಮಾಡಿ.',
  'Invalid admin email or password.': 'ನಿರ್ವಾಹಕರ ಇಮೇಲ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ತಪ್ಪಾಗಿದೆ.',
  'Admin email and password are required.': 'ನಿರ್ವಾಹಕರ ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ಅಗತ್ಯವಿದೆ.',
  'Please enter a valid admin email address.': 'ದಯವಿಟ್ಟು ಸರಿಯಾದ ನಿರ್ವಾಹಕರ ಇಮೇಲ್ ವಿಳಾಸ ನಮೂದಿಸಿ.',
  'Admin login is not configured.': 'ನಿರ್ವಾಹಕ ಲಾಗಿನ್ ಹೊಂದಿಸಲಾಗಿಲ್ಲ.',
  'Admin login failed': 'ನಿರ್ವಾಹಕ ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ',
  'Server error': 'ಸರ್ವರ್ ದೋಷ',
  'Product added to the store': 'ಉತ್ಪನ್ನವನ್ನು ಅಂಗಡಿಗೆ ಸೇರಿಸಲಾಗಿದೆ',
  'Product added successfully.': 'ಉತ್ಪನ್ನವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ.',
  'Product updated': 'ಉತ್ಪನ್ನವನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ',
  'Product updated.': 'ಉತ್ಪನ್ನವನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ.',
  'Product removed': 'ಉತ್ಪನ್ನವನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ',
  'Product removed.': 'ಉತ್ಪನ್ನವನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ.',
  'Stock updated': 'ಸ್ಟಾಕ್ ನವೀಕರಿಸಲಾಗಿದೆ',
  'Stock updated.': 'ಸ್ಟಾಕ್ ನವೀಕರಿಸಲಾಗಿದೆ.',
  'Enter a pack size.': 'ಪ್ಯಾಕ್ ಗಾತ್ರ ನಮೂದಿಸಿ.',
  'Enter a whole number of 0 or more.': '0 ಅಥವಾ ಹೆಚ್ಚಿನ ಪೂರ್ಣ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ.',
  'All default products are already in the store.': 'ಎಲ್ಲಾ ಡೀಫಾಲ್ಟ್ ಉತ್ಪನ್ನಗಳು ಈಗಾಗಲೇ ಅಂಗಡಿಯಲ್ಲಿವೆ.',
  'Loading admin dashboard…': 'ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
  Retry: 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
  'Photo ready to save.': 'ಫೋಟೋ ಉಳಿಸಲು ಸಿದ್ಧವಾಗಿದೆ.',
  'Saving product…': 'ಉತ್ಪನ್ನವನ್ನು ಉಳಿಸಲಾಗುತ್ತಿದೆ…',
  Customer: 'ಗ್ರಾಹಕ',
  'e.g. 1 kg': 'ಉದಾ. 1 kg',
  'Search products': 'ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿ',
  'Search by voice': 'ಧ್ವನಿಯಿಂದ ಹುಡುಕಿ',
  'Main navigation': 'ಮುಖ್ಯ ಸಂಚರಣೆ',
  'Items in cart': 'ಕಾರ್ಟ್‌ನಲ್ಲಿರುವ ವಸ್ತುಗಳು',
  Loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ',
  'Enter a 10-digit Indian mobile number': 'ಭಾರತೀಯ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ',
  'Selected delivery location on Google Maps': 'Google Maps‌ನಲ್ಲಿ ಆಯ್ಕೆಮಾಡಿದ ವಿತರಣಾ ಸ್ಥಳ'
};
const EN_TRANSLATIONS = Object.fromEntries(
  Object.entries(KN_TRANSLATIONS).map(([english, kannada]) => [kannada, english])
);

// ---- Admin / customer sign-in sessions -------------------------------------
// Kept in localStorage (not per-tab sessionStorage) so a new tab, a page refresh or
// pressing Home never signs the admin out. A session ends only on Logout or expiry.
function readJwtExpiry(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(payload).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    const exp = Number(JSON.parse(json).exp);
    return Number.isFinite(exp) ? exp * 1000 : 0;
  } catch (error) {
    return 0;
  }
}

function getAdminToken() {
  const token = LS.getItem(ADMIN_TOKEN_KEY) || SS.getItem(ADMIN_TOKEN_KEY) || '';
  if (!token) return '';
  const expiresAt = readJwtExpiry(token);
  if (expiresAt && expiresAt <= Date.now()) {
    clearAdminSession();
    return '';
  }
  return token;
}

function getAdminEmail() {
  return LS.getItem(ADMIN_EMAIL_KEY) || SS.getItem(ADMIN_EMAIL_KEY) || '';
}

function setAdminSession(token, email) {
  LS.setItem(ADMIN_TOKEN_KEY, token);
  LS.setItem(ADMIN_EMAIL_KEY, email || '');
  SS.removeItem(ADMIN_TOKEN_KEY);
  SS.removeItem(ADMIN_EMAIL_KEY);
}

function clearAdminSession() {
  LS.removeItem(ADMIN_TOKEN_KEY);
  LS.removeItem(ADMIN_EMAIL_KEY);
  SS.removeItem(ADMIN_TOKEN_KEY);
  SS.removeItem(ADMIN_EMAIL_KEY);
}

function getCustomerToken() {
  return LS.getItem(CUSTOMER_TOKEN_KEY) || SS.getItem(CUSTOMER_TOKEN_KEY) || '';
}

function setCustomerToken(token) {
  LS.setItem(CUSTOMER_TOKEN_KEY, token);
  SS.removeItem(CUSTOMER_TOKEN_KEY);
}

function clearCustomerToken() {
  LS.removeItem(CUSTOMER_TOKEN_KEY);
  SS.removeItem(CUSTOMER_TOKEN_KEY);
}

const state = {
  products: [],
  selectedCategory: 'All',
  searchTerm: '',
  cart: loadCart(),
  user: loadUser(),
  orders: loadOrders(),
  route: null,
  checkoutMode: 'cart',
  ordersRefreshTimer: null,
  orderTrackingRefreshTimer: null,
  storeLocation: 'Koramangala, Bengaluru, Karnataka, India',
  productsLoaded: false,
  productTranslations: {},
  productTranslationPromise: null,
  productsRefreshTimer: null,
  adminStockTimer: null
};

window.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  const app = document.getElementById('app');
  if (!app) return;

  const localeObserver = new MutationObserver(() => applyPreferredLanguage());
  localeObserver.observe(app, { childList: true, subtree: true, characterData: true });
  renderShell();
  attachEvents();
  setRoute(getInitialRoute());
  loadProducts();
  applyPreferredLanguage();
  scheduleLanguagePrompt();
  startProductPolling();
  verifyAdminSession();
}

function getPreferredLanguage() {
  return LS.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'kn';
}

function getInitialRoute() {
  if (window.__KM_ROUTE) return window.__KM_ROUTE;
  if (window.location.hash) return window.location.hash.replace('#', '');
  if (window.location.pathname.includes('/pages/')) {
    const page = window.location.pathname.split('/').pop().replace('.html', '');
    if (page && page !== 'index') return page;
  }
  return 'home';
}

function renderShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand" data-route="home">
          <img class="brand-logo" src="images/kamagere-logo.svg" alt="Kamagere Mart logo" />
          <div class="welcome-title welcome-title-header" aria-label="Welcome to Kamagere-Mart">
            <span class="welcome-script">Welcome to</span>
            <span class="welcome-brand" aria-hidden="true">${welcomeBrandLetters('Kamagere-Mart')}</span>
          </div>
        </div>
        <div class="topbar-actions">
        <div class="lang-toggle" role="group" aria-label="Language / ಭಾಷೆ">
          <span class="lang-thumb" aria-hidden="true"></span>
          <button type="button" class="lang-opt" data-action="set-language" data-lang="en" data-label="English" aria-pressed="true"></button>
          <button type="button" class="lang-opt" data-action="set-language" data-lang="kn" data-label="ಕನ್ನಡ" aria-pressed="false"></button>
        </div>
        <button type="button" class="header-cart-btn" data-route="cart" aria-label="Cart" title="Cart">
          <svg class="header-cart-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>
          <span class="header-cart-badge" id="header-cart-badge" aria-label="Items in cart">0</span>
        </button>
        </div>
      </div>
    </header>
    <div class="admin-bar" id="admin-bar" hidden>
      <div class="admin-bar-inner">
        <svg class="admin-bar-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>
        <span class="admin-bar-label">Admin</span>
        <span class="admin-bar-email"></span>
        <button type="button" class="admin-bar-btn" data-route="admin">Dashboard</button>
        <button type="button" class="admin-bar-btn admin-bar-logout" data-action="admin-logout">Logout</button>
      </div>
    </div>
    <main id="page-content" class="page-shell"></main>
    <nav class="app-nav" id="app-nav" aria-label="Main navigation"></nav>
    <div id="toast" class="toast"></div>
  `;
  updateAccountMenu();
  updateCartBadge();
  syncLanguageToggle();
}

function updateAccountMenu() {
  updateAdminBar();
  const nav = document.getElementById('app-nav');
  if (!nav) return;

  const links = [
    {
      label: 'Home',
      route: 'home',
      icon: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/>'
    },
    {
      label: 'Orders',
      route: 'orders',
      icon: '<path d="M6 3h12a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z"/><path d="M8 8h8M8 12h8"/>'
    },
    {
      label: 'Cart',
      route: 'cart',
      icon: '<path d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>'
    },
    {
      label: 'Profile',
      route: 'profile',
      icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
    }
  ];

  if (getAdminToken()) {
    links.push({
      label: 'Admin',
      route: 'admin',
      icon: '<path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>'
    });
  }

  nav.innerHTML = `
    <div class="app-nav-inner">
      ${links.map(({ label, route, icon }) => `
        <a class="app-nav-link ${state.route === route ? 'active' : ''}" href="#${route}" data-route="${route}" ${state.route === route ? 'aria-current="page"' : ''}>
          <svg class="app-nav-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
          <span>${label}</span>
          ${route === 'cart' ? '<span class="app-nav-badge" id="bottom-cart-badge" aria-label="Items in cart">0</span>' : ''}
        </a>
      `).join('')}
    </div>
  `;
  updateCartBadge();
}

function attachEvents() {
  const app = document.getElementById('app');

  app.addEventListener('click', (event) => {
    if (event.target.classList?.contains('registration-modal-backdrop')) {
      closeRegistrationPopup();
      return;
    }

    const routeButton = event.target.closest('[data-route]');
    if (routeButton) {
      closeOrderSuccess();
      if (routeButton instanceof HTMLAnchorElement) event.preventDefault();
      const route = routeButton.getAttribute('data-route');
      if (route) {
        if (route === 'cart') state.checkoutMode = 'cart';
        setRoute(route);
      }
      return;
    }

    const langButton = event.target.closest('[data-action="set-language"]');
    if (langButton) {
      setLanguage(langButton.getAttribute('data-lang'));
      return;
    }

    const voiceButton = event.target.closest('[data-action="voice-search"]');
    if (voiceButton) {
      event.preventDefault();
      toggleVoiceSearch(voiceButton);
      return;
    }

    const passwordToggle = event.target.closest('[data-action="toggle-password"]');
    if (passwordToggle) {
      const passwordInput = passwordToggle.closest('.password-field')?.querySelector('input[name="password"]');
      if (!(passwordInput instanceof HTMLInputElement)) return;

      const isVisible = passwordInput.type === 'password';
      passwordInput.type = isVisible ? 'text' : 'password';
      passwordToggle.classList.toggle('is-visible', isVisible);
      passwordToggle.setAttribute('aria-pressed', String(isVisible));
      const label = isVisible ? 'Hide password' : 'Show password';
      const localizedLabel = translateAppText(label, getPreferredLanguage()) || label;
      passwordToggle.setAttribute('aria-label', localizedLabel);
      passwordToggle.title = localizedLabel;
      return;
    }

    const addButton = event.target.closest('[data-action="add-cart"]');
    if (addButton) {
      const productId = Number(addButton.getAttribute('data-product-id'));
      addToCart(productId);
      return;
    }

    const buyButton = event.target.closest('[data-action="buy-now"]');
    if (buyButton) {
      const productId = Number(buyButton.getAttribute('data-product-id'));
      buyNow(productId);
      return;
    }

    const incButton = event.target.closest('[data-action="inc-qty"]');
    if (incButton) {
      const productId = Number(incButton.getAttribute('data-product-id'));
      adjustCartQuantity(productId, 1);
      return;
    }

    const decButton = event.target.closest('[data-action="dec-qty"]');
    if (decButton) {
      const productId = Number(decButton.getAttribute('data-product-id'));
      adjustCartQuantity(productId, -1);
      return;
    }

    const removeButton = event.target.closest('[data-action="remove-cart"]');
    if (removeButton) {
      const productId = Number(removeButton.getAttribute('data-product-id'));
      removeCartItem(productId);
      return;
    }

    const categoryButton = event.target.closest('[data-category]');
    if (categoryButton) {
      state.selectedCategory = categoryButton.getAttribute('data-category');
      if (state.selectedCategory === 'All') state.searchTerm = '';
      renderHome();
      return;
    }

    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      const action = actionButton.getAttribute('data-action');
      if (action === 'checkout') {
        state.checkoutMode = 'cart';
        setRoute('checkout');
      }
      if (action === 'use-current-location') {
        useCurrentLocation();
      }
      if (action === 'logout') {
        logout();
      }
      if (action === 'load-login') {
        if (actionButton.closest('#registration-modal')) {
          showRegistrationPopup('login');
        } else {
          setRoute('auth');
        }
      }
      if (action === 'load-register') {
        if (actionButton.closest('#registration-modal')) {
          showRegistrationPopup('register');
        } else {
          setRoute('auth', { panel: 'register' });
        }
      }
      if (action === 'close-registration-popup') {
        closeRegistrationPopup();
      }
      if (action === 'admin-logout') {
        logoutAdmin();
      }
      if (action === 'admin-retry') {
        renderAdminDashboard();
      }
      if (action === 'edit-product') {
        editProduct(Number(actionButton.getAttribute('data-product-id')));
      }
      if (action === 'cancel-product-edit') {
        resetProductForm();
      }
      if (action === 'delete-product') {
        handleDeleteProduct(Number(actionButton.getAttribute('data-product-id')));
      }
      if (action === 'save-card-details') {
        handleSaveCardDetails(Number(actionButton.getAttribute('data-product-id')), actionButton);
      }
      if (action === 'set-stock') {
        handleSetStock(Number(actionButton.getAttribute('data-product-id')), actionButton);
      }
      if (action === 'restore-defaults') {
        handleRestoreDefaults();
      }
      if (action === 'admin-refresh') {
        renderAdminDashboard();
      }
      if (action === 'cancel-order') {
        cancelOrder(actionButton.getAttribute('data-order-id'));
      }
      if (action === 'share-order-tracking') {
        shareOrderTracking(actionButton.getAttribute('data-order-id'));
      }
      if (action === 'edit-profile') {
        setProfileEditing(true);
      }
      if (action === 'cancel-profile-edit') {
        renderProfile();
      }
    }
  });

  app.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.dataset.formType === 'login') {
      event.preventDefault();
      await handleLogin(form);
      return;
    }

    if (form.dataset.formType === 'add-product') {
      event.preventDefault();
      await handleAddProduct(form);
      return;
    }

    if (form.dataset.formType === 'register') {
      event.preventDefault();
      await handleRegister(form);
      return;
    }

    if (form.dataset.formType === 'search') {
      event.preventDefault();
      state.searchTerm = form.querySelector('input')?.value?.trim() || '';
      renderHome();
      return;
    }

    if (form.dataset.formType === 'checkout') {
      event.preventDefault();
      await handleCheckout(form);
      return;
    }

    if (form.dataset.formType === 'profile') {
      event.preventDefault();
      await handleProfileUpdate(form);
      return;
    }

    if (form.dataset.formType === 'admin-store-location') {
      event.preventDefault();
      await handleStoreLocationUpdate(form);
      return;
    }

  });

  app.addEventListener('change', (event) => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.name === 'language-choice') {
      LS.setItem(LANGUAGE_KEY, input.value);
      SS.setItem(LANGUAGE_PROMPT_KEY, '1');
      closeLanguagePrompt();
      applyPreferredLanguage();
      if (!state.user && !getAdminToken()) showRegistrationPopup('login');
      return;
    }
    if (input instanceof HTMLInputElement && input.id === 'product-image-file') {
      handleProductImageSelection(input);
    }
    if (input instanceof HTMLInputElement && input.id === 'profile-image-file') {
      handleProfileImageSelection(input);
    }
    if (input instanceof HTMLSelectElement && input.dataset.action === 'update-order-status') {
      handleAdminOrderStatusUpdate(input);
    }
  });

  app.addEventListener('input', (event) => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.closest('[data-form-type="search"]')) {
      state.searchTerm = input.value.trim();
      const selectionStart = input.selectionStart;
      renderHome();
      const refreshedInput = document.querySelector('.products-search-row input');
      refreshedInput?.focus({ preventScroll: true });
      if (selectionStart !== null) refreshedInput?.setSelectionRange(selectionStart, selectionStart);
      return;
    }
    if (input instanceof HTMLInputElement && input.id === 'product-image') {
      const form = input.closest('[data-form-type="add-product"]');
      if (form) form.dataset.imageData = '';
      updateProductImagePreview(input.value.trim());
    }
  });

  // Sign in / out in another tab of the same browser is reflected here too
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== ADMIN_TOKEN_KEY) return;
    updateAccountMenu();
    if (!getAdminToken() && state.route === 'admin') {
      setRoute('auth');
    } else if (state.route === 'home') {
      renderHome();
    }
  });

  window.addEventListener('hashchange', () => {
    const route = (window.location.hash || '').replace('#', '') || 'home';
    if (route !== state.route) setRoute(route);
  });

}

function setRoute(route, options = {}) {
  const target = route || 'home';
  if (target === 'admin' && !getAdminToken()) {
    setRoute('auth');
    return;
  }
  if ((target === 'admin-login' || target === 'auth') && getAdminToken()) {
    setRoute('admin');
    return;
  }
  if (target === 'admin-login') {
    setRoute('auth');
    return;
  }
  if (target !== 'admin' && state.adminStockTimer) {
    clearInterval(state.adminStockTimer);
    state.adminStockTimer = null;
  }
  state.route = target;
  if (target !== 'orders' && state.ordersRefreshTimer) {
    clearInterval(state.ordersRefreshTimer);
    state.ordersRefreshTimer = null;
  }
  if (target !== 'orders' && state.orderTrackingRefreshTimer) {
    clearInterval(state.orderTrackingRefreshTimer);
    state.orderTrackingRefreshTimer = null;
  }
  window.location.hash = target === 'home' ? '' : target;

  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;

  updateAccountMenu();

  switch (target) {
    case 'home':
      renderHome();
      break;
    case 'cart':
      renderCart();
      break;
    case 'checkout':
      renderCheckout();
      break;
    case 'orders':
      if (isAdminSession()) {
        // The admin sees every customer order in the admin area
        renderAdminDashboard().then(() => document.getElementById('admin-orders')?.scrollIntoView({ block: 'start' }));
      } else {
        renderOrders();
      }
      break;
    case 'auth':
      renderAuth(options.panel || 'login');
      break;
    case 'profile':
      renderProfile();
      break;
    case 'contact':
      renderContact();
      break;
    case 'faqs':
      renderFaqs();
      break;
    case 'admin':
      renderAdminDashboard();
      break;
    default:
      renderHome();
  }
  applyPreferredLanguage();
  if (target === 'orders' && !isAdminSession()) loadStoreLocation();
  if (state.productsLoaded && ['home', 'cart', 'checkout'].includes(target)) loadProducts();
}

// True while the store admin (and not a customer) is signed in
function isAdminSession() {
  return Boolean(getAdminToken()) && !state.user;
}

function renderContact() {
  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;
  pageContent.innerHTML = `
    <section class="card contact-card">
      <h1>Contact us</h1>
      <p>For help with shopping or orders, call our store:</p>
      <a class="primary-btn contact-phone" href="tel:+9100000000">91+ 0000000000</a>
    </section>
  `;
}

function renderFaqs() {
  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;
  pageContent.innerHTML = `
    <section class="card faq-card">
      <h1>Frequently asked questions</h1>
      <details>
        <summary>How do I place an order?</summary>
        <p>Add items to your cart, then continue to checkout and submit your delivery details.</p>
      </details>
      <details>
        <summary>What payment methods are available?</summary>
        <p>Choose Cash on Delivery or UPI at checkout.</p>
      </details>
      <details>
        <summary>Can I cancel an order?</summary>
        <p>You can cancel a confirmed order from Orders within two minutes after placing it.</p>
      </details>
      <details>
        <summary>How much is delivery?</summary>
        <p>Delivery is free for orders of ₹199 or more; otherwise the fee is ₹25.</p>
      </details>
    </section>
  `;
}

function welcomeBrandLetters(text) {
  return Array.from(text)
    .map((ch, i) => `<span class="wl wl-${i % 2 ? 'b' : 'a'}" style="animation-delay:${(i * 0.06).toFixed(2)}s">${escapeHtml(ch)}</span>`)
    .join('');
}

function showOrderSuccess(order) {
  document.getElementById('order-success-modal')?.remove();
  const app = document.getElementById('app');
  if (!app) return;
  const modal = document.createElement('div');
  modal.id = 'order-success-modal';
  modal.className = 'order-success-backdrop';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'order-success-title');
  modal.innerHTML = `
    <section class="order-success-modal">
      <div class="success-check">
        <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15 27l8 8 14-16" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h2 id="order-success-title">Thanks for placing your order!</h2>
      <div class="order-success-id">Order ${escapeHtml(order.id)}</div>
      <p>Your order is confirmed and will reach you within 20 minutes.</p>
      <div class="order-success-actions">
        <button class="secondary-btn" data-route="orders">View orders</button>
        <button class="primary-btn" data-route="home">Continue shopping</button>
      </div>
    </section>
  `;
  app.appendChild(modal);
  applyPreferredLanguage();
  modal.querySelector('.primary-btn')?.focus();
}

function closeOrderSuccess() {
  document.getElementById('order-success-modal')?.remove();
}

function renderHome() {
  const products = getVisibleProducts();
  const showViewAll = state.selectedCategory !== 'All' || Boolean(state.searchTerm.trim());
  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;

  pageContent.innerHTML = `
    <section class="hero">
      <div>
        <p class="pill" style="margin-bottom:12px;">Fresh groceries at your doorstep</p>
        <div class="delivery-banner">
          <img class="delivery-banner-bg" src="images/kamagere-poster.png" alt="" aria-hidden="true" />
          <h1>Delivery within 20 mins</h1>
        </div>
        <p class="hero-text">Shop staples, dairy, fruits, snacks and household essentials with delivery within 20 minutes.</p>
      </div>
      <div class="hero-card">
        <h3>Why shop with us?</h3>
        <div class="hero-stat-grid">
          <div class="stat-box">
            <span>Fresh Picks</span>
            <strong>1200+</strong>
          </div>
          <div class="stat-box">
            <span>Best Deals</span>
            <strong>Save on every order</strong>
          </div>
          <div class="stat-box">
            <span>Offers</span>
            <strong>Up to 30%</strong>
          </div>
          <div class="stat-box">
            <span>Saved</span>
            <strong>₹${formatRupees(getTotalSavedAmount())}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="category-section">
      <div class="section-heading">
        <div>
          <h2>Shop by Category</h2>
          <p>Choose a category to find your daily essentials quickly.</p>
        </div>
        ${showViewAll ? `<button class="chip ${state.selectedCategory === 'All' ? 'active' : ''}" data-category="All">View All</button>` : ''}
      </div>

      <form class="products-search-row" data-form-type="search" role="search">
        <input type="search" aria-label="Search products" placeholder="Search vegetables, dairy, atta..." value="${escapeHtml(state.searchTerm)}" />
        <button type="button" class="voice-btn" data-action="voice-search" aria-label="Search by voice" title="Search by voice" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="9" y="2" width="6" height="12" rx="3"></rect>
            <path d="M5 11a7 7 0 0 0 14 0"></path>
            <path d="M12 18v4"></path>
            <path d="M8 22h8"></path>
          </svg>
        </button>
      </form>

      <div class="category-grid">
        ${window.KM_DATA.categoryGroups.map((category) => `
          <button class="category-card ${(state.selectedCategory === category.id || (category.id === 'Fresh Items' && ['Fruits', 'Vegetables', 'Meat'].includes(state.selectedCategory))) ? 'active' : ''}" data-category="${category.id}" type="button">
            <div class="category-card-image">
              <img src="${escapeHtml(category.image)}" alt="${escapeHtml(translateAppText(category.name, getPreferredLanguage()) || category.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='images/categories/fresh-items.png';" />
            </div>
            <div class="category-card-body">
              <strong>${escapeHtml(translateAppText(category.name, getPreferredLanguage()) || category.name)}</strong>
              <span>${escapeHtml(translateAppText(category.subtitle, getPreferredLanguage()) || category.subtitle)}</span>
            </div>
          </button>
        `).join('')}
      </div>

      ${['Fresh Items', 'Fruits', 'Vegetables', 'Meat'].includes(state.selectedCategory) ? `
        <div class="subcategory-section">
          <div class="subcategory-title">Fresh Items</div>
          <div class="subcategory-grid">
            ${window.KM_DATA.categoryGroups.find((c) => c.id === 'Fresh Items').subcategories.map((subcategory) => `
              <button class="subcategory-card ${state.selectedCategory === subcategory.id ? 'active' : ''}" data-category="${subcategory.id}" type="button">
                <img src="${escapeHtml(subcategory.image)}" alt="${escapeHtml(translateAppText(subcategory.name, getPreferredLanguage()) || subcategory.name)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='images/categories/fresh-items.png';" />
                <span>${escapeHtml(translateAppText(subcategory.name, getPreferredLanguage()) || subcategory.name)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

    </section>

    <div class="catalog-toolbar">
      <div class="catalog-label">${state.selectedCategory === 'All' ? (translateAppText('All products', getPreferredLanguage()) || 'All products') : escapeHtml(translateAppText(state.selectedCategory, getPreferredLanguage()) || state.selectedCategory)}</div>
      <div class="catalog-actions">
        <button class="primary-btn" data-route="cart">Go to cart</button>
        <button class="secondary-btn" data-route="orders">View orders</button>
      </div>
    </div>

    ${products.length ? `
      <section class="catalog-grid">
        ${products.map((product) => `
          <article class="product-card ${isSoldOut(product) ? 'is-sold-out' : ''}">
            <div class="product-image">
              <img src="${escapeHtml(product.image)}" alt="${escapeHtml(getProductName(product))}" loading="lazy" />
              <span class="discount-badge">${Number(product.discount) || 0}% OFF</span>
              ${isSoldOut(product) ? '<span class="sold-out-ribbon">Sold out</span>' : ''}
            </div>
            <div class="product-body">
              <div class="product-category">${escapeHtml(translateAppText(product.category, getPreferredLanguage()) || product.category)}</div>
              <h3 class="product-title">${escapeHtml(getProductName(product))}</h3>
              <div class="product-meta">
                <div>
                  <div class="product-price">₹${Number(product.price).toLocaleString('en-IN')}</div>
                  <div class="old-price">₹${Number(product.oldPrice).toLocaleString('en-IN')}</div>
                </div>
                <div class="item-unit">${escapeHtml(product.unit)}</div>
              </div>
              <div class="product-description">${escapeHtml(getProductDescription(product))}</div>
              ${isSoldOut(product) ? `
                <div class="product-actions">
                  <button class="add-cart-btn" type="button" disabled>Sold out</button>
                </div>
                <div class="sold-out-note">Product not available</div>
              ` : `
                <div class="product-actions">
                  ${renderProductCartControl(product)}
                  <button class="buy-now-btn" data-action="buy-now" data-product-id="${product.id}">Buy Now</button>
                </div>
              `}
              ${isAdminSession() ? renderAdminCardTools(product) : ''}
            </div>
          </article>
        `).join('')}
      </section>
    ` : `
      <div class="empty-state">No products match your search. Try a different keyword or category.</div>
    `}
  `;
}

// Admin-only controls shown on each product card of the storefront
function renderAdminCardTools(product) {
  const id = Number(product.id);
  return `
    <div class="admin-card-tools">
      <div class="admin-card-head">
        <span class="stock-pill ${isSoldOut(product) ? 'is-out' : ''}">${isSoldOut(product) ? 'Sold out' : `In stock: ${getStock(product)}`}</span>
        <button type="button" class="outline-btn danger-btn" data-action="delete-product" data-product-id="${id}">Remove</button>
      </div>
      <div class="admin-card-fields">
        <label>Pack size
          <input type="text" maxlength="100" value="${escapeHtml(product.unit)}" data-card-pack="${id}" />
        </label>
        <label>Stock
          <input type="number" min="0" step="1" inputmode="numeric" value="${getStock(product)}" data-card-stock="${id}" />
        </label>
      </div>
      <button type="button" class="primary-btn admin-card-save" data-action="save-card-details" data-product-id="${id}">Save pack size &amp; stock</button>
    </div>
  `;
}

function renderProductCartControl(product) {
  const cartItem = state.cart.find((item) => Number(item.id) === Number(product.id));
  if (!cartItem || cartItem.quantity <= 0) {
    return `<button class="add-cart-btn" data-action="add-cart" data-product-id="${product.id}">Add to Cart</button>`;
  }

  const safeName = escapeHtml(product.name);
  return `
    <div class="product-quantity" aria-label="${safeName} quantity in cart">
      <button type="button" data-action="dec-qty" data-product-id="${product.id}" aria-label="Remove one ${safeName}">−</button>
      <span aria-live="polite">${cartItem.quantity}</span>
      <button type="button" data-action="inc-qty" data-product-id="${product.id}" aria-label="Add one ${safeName}" ${cartItem.quantity >= getStock(product) ? 'disabled' : ''}>+</button>
    </div>
  `;
}

// Stock helpers: a product without a stock figure is treated as available
function getStock(product) {
  if (!product || product.stock === undefined || product.stock === null) return Infinity;
  return Math.max(0, Number(product.stock) || 0);
}

function isSoldOut(product) {
  return getStock(product) <= 0;
}

function renderCart() {
  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;

  const cartItems = getCartItems();
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const delivery = subtotal >= 199 ? 0 : 25;
  const total = subtotal + delivery;
  const totalSaved = calculateCartSavings(cartItems);

  const hasUnavailable = cartItems.some((item) => item.quantity > getStock(item.product));

  if (!cartItems.length) {
    pageContent.innerHTML = `
      <div class="empty-state">
        <h2>Your cart is empty</h2>
        <p>Browse groceries and add items to start your order.</p>
        <button class="primary-btn" data-route="home">Continue shopping</button>
      </div>
    `;
    return;
  }

  pageContent.innerHTML = `
    <div class="cart-layout">
      <div class="card">
        <h3>Shopping cart</h3>
        ${cartItems.map((item) => `
          <div class="cart-item">
            <div class="cart-thumb"><img src="${item.product.image}" alt="${escapeHtml(item.product.name)}" /></div>
            <div>
              <h4>${item.product.name}</h4>
              <div class="item-unit">${item.product.unit}</div>
              ${isSoldOut(item.product)
                ? '<div class="cart-stock-warning">Sold out</div>'
                : item.quantity > getStock(item.product)
                  ? `<div class="cart-stock-warning">Only ${getStock(item.product)} left</div>`
                  : ''}
              <div class="qty-controls">
                <button data-action="dec-qty" data-product-id="${item.product.id}">−</button>
                <span>${item.quantity}</span>
                <button data-action="inc-qty" data-product-id="${item.product.id}" ${item.quantity >= getStock(item.product) ? 'disabled' : ''}>+</button>
              </div>
            </div>
            <div>
              <div class="item-price">₹${item.product.price * item.quantity}</div>
              <div style="text-align:right; margin-top:8px;">
                <button class="outline-btn" data-action="remove-cart" data-product-id="${item.product.id}">Remove</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <aside class="summary-box">
        <h3>Order summary</h3>
        <div class="summary-line"><span>Subtotal</span><strong>₹${subtotal}</strong></div>
        <div class="summary-line"><span>Delivery</span><strong>₹${delivery}</strong></div>
        <div class="summary-line savings-line"><span>Total saved</span><strong>₹${formatRupees(totalSaved)}</strong></div>
        <div class="summary-line total"><span>Total</span><strong>₹${total}</strong></div>
        <p class="delivery-policy">Free delivery on orders of ₹199 or more; otherwise ₹25.</p>
        ${hasUnavailable ? '<p class="cart-stock-warning">Some items are sold out or low on stock. Remove them or reduce the quantity to continue.</p>' : ''}
        <button class="primary-btn" style="width:100%; margin-top:12px;" data-action="checkout" ${hasUnavailable ? 'disabled' : ''}>Proceed to checkout</button>
      </aside>
    </div>
  `;
}

function renderCheckout() {
  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;

  const items = state.checkoutMode === 'buy-now' ? getBuyNowItems() : getCartItems();

  if (!items.length) {
    pageContent.innerHTML = `
      <div class="empty-state">
        <h2>No items to checkout</h2>
        <button class="primary-btn" data-route="home">Add products</button>
      </div>
    `;
    return;
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const delivery = subtotal >= 199 ? 0 : 25;
  const total = subtotal + delivery;
  const totalSaved = calculateCartSavings(items);
  const user = state.user || {};

  pageContent.innerHTML = `
    <div class="checkout-layout">
      <div class="card">
        <h3>Delivery details</h3>
        <form class="form-grid" data-form-type="checkout">
          <div class="form-row">
            <div>
              <label for="name">Full name</label>
              <input id="name" name="name" value="${escapeHtml(user.name || '')}" required />
            </div>
            <div>
              <label for="phone">Phone</label>
              <input id="phone" name="phone" type="tel" value="${escapeHtml(user.phone || '')}" pattern="[6-9][0-9]{9}" title="Enter a 10-digit Indian mobile number" required />
            </div>
          </div>

          <div>
            <label for="email">Email</label>
            <input id="email" name="email" type="email" value="${escapeHtml(user.email || '')}" required />
          </div>

          <div>
            <label for="address">Address</label>
            <textarea id="address" name="address" placeholder="House/flat, street, landmark, city..." required>${escapeHtml(user.address || '')}</textarea>
          </div>

          <div class="location-picker">
            <button class="secondary-btn" type="button" data-action="use-current-location">Use my current location</button>
            <p class="location-status" id="location-status" aria-live="polite">Allow location access to show your delivery point on Google Maps.</p>
            <div class="location-map" id="location-map" hidden>
              <iframe title="Selected delivery location on Google Maps" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
              <a id="location-map-link" href="#" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
            </div>
          </div>

          <div class="form-row">
            <div>
              <label for="payment">Payment method</label>
              <select id="payment" name="payment">
                <option value="COD">Cash on Delivery</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
            <div>
              <label for="source">Order source</label>
              <select id="source" name="source">
                <option value="Cart" ${state.checkoutMode === 'cart' ? 'selected' : ''}>Cart</option>
                <option value="Buy Now" ${state.checkoutMode === 'buy-now' ? 'selected' : ''}>Buy Now</option>
              </select>
            </div>
          </div>

          <button class="primary-btn" type="submit" style="width: fit-content;">Place order</button>
        </form>
      </div>

      <aside class="summary-box">
        <h3>Order summary</h3>
        ${items.map((item) => `
          <div class="summary-line">
            <span>${item.product.name} × ${item.quantity}</span>
            <strong>₹${item.product.price * item.quantity}</strong>
          </div>
        `).join('')}
        <div class="summary-line"><span>Subtotal</span><strong>₹${subtotal}</strong></div>
        <div class="summary-line"><span>Delivery</span><strong>₹${delivery}</strong></div>
        <div class="summary-line savings-line"><span>Total saved</span><strong>₹${formatRupees(totalSaved)}</strong></div>
        <div class="summary-line total"><span>Total</span><strong>₹${total}</strong></div>
        <p class="delivery-policy">Free delivery on orders of ₹199 or more; otherwise ₹25.</p>
      </aside>
    </div>
  `;
}

function renderAuth(panel = 'login') {
  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;

  pageContent.innerHTML = authMarkup(panel);
  applyPreferredLanguage();
}

function authMarkup(panel = 'login', idPrefix = '') {
  const isLogin = panel === 'login' || panel === 'admin-login';
  const fieldId = (id) => `${idPrefix}${id}`;
  return `
    <div class="auth-grid">
      <div class="auth-panel">
        <h3>${isLogin ? 'Login' : 'Create account'}</h3>
        <form data-form-type="${isLogin ? 'login' : 'register'}">
          ${!isLogin ? `
            <div>
              <label for="${fieldId('name')}">Full name</label>
              <input id="${fieldId('name')}" name="name" required />
            </div>
          ` : ''}

          <div style="margin-top: 12px;">
            <label for="${fieldId('email')}">Email</label>
            <input id="${fieldId('email')}" name="email" type="email" autocomplete="username" required />
          </div>

          ${!isLogin ? `
            <div style="margin-top: 12px;">
              <label for="${fieldId('phone')}">Phone</label>
              <input id="${fieldId('phone')}" name="phone" type="tel" required />
            </div>
          ` : ''}

          <div style="margin-top: 12px;">
            <label for="${fieldId('password')}">Password</label>
            <div class="password-field">
              <input id="${fieldId('password')}" name="password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required />
              <button type="button" class="password-toggle" data-action="toggle-password" aria-label="Show password" title="Show password" aria-pressed="false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                  <path class="password-eye-slash" d="m4 4 16 16"></path>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" class="primary-btn" style="margin-top:16px; width:100%;">
            ${isLogin ? 'Login' : 'Register'}
          </button>
        </form>
      </div>

      <div class="auth-panel">
        <h3>${isLogin ? 'Customer benefits' : 'Already have an account?'}</h3>
        ${isLogin ? `
          <ul>
            <li>Track all orders in one place</li>
            <li>Save delivery addresses</li>
            <li>Early access to offers and discounts</li>
            <li>Fast checkout for repeated shopping</li>
          </ul>
        ` : '<p>Sign in to continue shopping.</p>'}
        <button class="secondary-btn" data-action="${isLogin ? 'load-register' : 'load-login'}" style="margin-top: 12px; width:100%;">
          ${isLogin ? 'Need an account? Register' : 'Already a member? Login'}
        </button>
      </div>
    </div>
  `;
}

function scheduleLanguagePrompt() {
  window.setTimeout(() => {
    if (SS.getItem(LANGUAGE_PROMPT_KEY)) return;
    showLanguagePrompt();
  }, 3000);
}

function showLanguagePrompt() {
  if (document.getElementById('language-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'language-modal';
  modal.className = 'language-modal-backdrop';
  modal.innerHTML = `
    <section class="language-modal" role="dialog" aria-modal="true" aria-labelledby="language-modal-title">
      <h2 id="language-modal-title">Choose your preferred language</h2>
      <p>Select a language to continue.</p>
      <div class="language-options" role="radiogroup" aria-labelledby="language-modal-title">
        <label class="language-option" for="language-choice-en">
          <input id="language-choice-en" type="radio" name="language-choice" value="en" />
          <span lang="en">English</span>
        </label>
        <label class="language-option" for="language-choice-kn">
          <input id="language-choice-kn" type="radio" name="language-choice" value="kn" />
          <span lang="kn">ಕನ್ನಡ</span>
        </label>
      </div>
    </section>
  `;
  document.getElementById('app')?.appendChild(modal);
  applyPreferredLanguage();
  modal.querySelector('input[name="language-choice"]')?.focus();
}

function closeLanguagePrompt() {
  document.getElementById('language-modal')?.remove();
}

function showRegistrationPopup(panel = 'register') {
  let modal = document.getElementById('registration-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'registration-modal';
    modal.className = 'registration-modal-backdrop';
    document.getElementById('app')?.appendChild(modal);
  }
  const isLogin = panel === 'login';
  modal.innerHTML = `
    <section class="registration-modal" role="dialog" aria-modal="true" aria-labelledby="registration-modal-title">
      <button class="modal-close" type="button" data-action="close-registration-popup" aria-label="Close">×</button>
      <h2 id="registration-modal-title">${isLogin ? 'Login' : 'Create your account'}</h2>
      <p>${isLogin ? 'Sign in to continue shopping.' : 'Register for a Kamagere Mart account'}</p>
      ${authMarkup(panel, 'popup-')}
    </section>
  `;
  applyPreferredLanguage();
  modal.querySelector('input[name="email"]')?.focus();
}

function closeRegistrationPopup() {
  document.getElementById('registration-modal')?.remove();
}

function translateAppText(text, language) {
  if (language === 'en') {
    if (EN_TRANSLATIONS[text]) return EN_TRANSLATIONS[text];
    const order = text.match(/^ಆರ್ಡರ್ (.+)$/);
    if (order) return `Order ${order[1]}`;
    const discount = text.match(/^(\d+)% ರಿಯಾಯಿತಿ$/);
    if (discount) return `${discount[1]}% OFF`;
    const cancellation = text.match(/^ರದ್ದುಮಾಡಲು ಲಭ್ಯವಿರುವ ಸಮಯ (.+)$/);
    if (cancellation) return `Cancel available for ${cancellation[1]}`;
    const addItem = text.match(/^(.+) ಸೇರಿಸಿ$/);
    if (addItem) return `Add one ${addItem[1]}`;
    const removeItem = text.match(/^(.+) ತೆಗೆದುಹಾಕಿ$/);
    if (removeItem) return `Remove one ${removeItem[1]}`;
    const signedIn = text.match(/^ನಿರ್ವಾಹಕರಾಗಿ ಸೈನ್ ಇನ್ ಆಗಿದ್ದೀರಿ: (.+)$/);
    if (signedIn) return `Signed in as ${signedIn[1]}`;
    const inStock = text.match(/^ಸ್ಟಾಕ್‌ನಲ್ಲಿದೆ: (\d+)$/);
    if (inStock) return `In stock: ${inStock[1]}`;
    const stockFor = text.match(/^(.+) ಸ್ಟಾಕ್ ಪ್ರಮಾಣ$/);
    if (stockFor) return `Stock quantity for ${EN_TRANSLATIONS[stockFor[1]] || stockFor[1]}`;
    const soldOutMsg = text.match(/^(.+) ಸ್ಟಾಕ್ ಖಾಲಿಯಾಗಿದೆ\.$/);
    if (soldOutMsg) return `${EN_TRANSLATIONS[soldOutMsg[1]] || soldOutMsg[1]} is sold out.`;
    const lineQty = text.match(/^(.+) × (\d+)$/);
    if (lineQty && EN_TRANSLATIONS[lineQty[1]]) return `${EN_TRANSLATIONS[lineQty[1]]} × ${lineQty[2]}`;
    return undefined;
  }
  if (KN_TRANSLATIONS[text]) return KN_TRANSLATIONS[text];

  const signedIn = text.match(/^Signed in as (.+)$/);
  if (signedIn) return `ನಿರ್ವಾಹಕರಾಗಿ ಸೈನ್ ಇನ್ ಆಗಿದ್ದೀರಿ: ${signedIn[1]}`;
  const inStock = text.match(/^In stock: (\d+)$/);
  if (inStock) return `ಸ್ಟಾಕ್‌ನಲ್ಲಿದೆ: ${inStock[1]}`;
  const stockFor = text.match(/^Stock quantity for (.+)$/);
  if (stockFor) return `${KN_TRANSLATIONS[stockFor[1]] || stockFor[1]} ಸ್ಟಾಕ್ ಪ್ರಮಾಣ`;
  const soldOutMsg = text.match(/^(.+) is sold out\.$/);
  if (soldOutMsg) return `${KN_TRANSLATIONS[soldOutMsg[1]] || soldOutMsg[1]} ಸ್ಟಾಕ್ ಖಾಲಿಯಾಗಿದೆ.`;
  const onlyOf = text.match(/^Only (\d+) of (.+?) (?:is|are)? ?(?:available|left)\.?$/);
  if (onlyOf) return `${KN_TRANSLATIONS[onlyOf[2]] || onlyOf[2]} ಕೇವಲ ${onlyOf[1]} ಮಾತ್ರ ಲಭ್ಯವಿದೆ.`;
  const onlyLeft = text.match(/^Only (\d+) (?:left|available)\.?$/);
  if (onlyLeft) return `ಕೇವಲ ${onlyLeft[1]} ಮಾತ್ರ ಲಭ್ಯವಿದೆ.`;
  const restored = text.match(/^(\d+) default products? restored\.$/);
  if (restored) return `${restored[1]} ಡೀಫಾಲ್ಟ್ ಉತ್ಪನ್ನ(ಗಳು) ಮರುಸ್ಥಾಪಿಸಲಾಗಿದೆ.`;
  const lineQty = text.match(/^(.+) × (\d+)$/);
  if (lineQty && KN_TRANSLATIONS[lineQty[1]]) return `${KN_TRANSLATIONS[lineQty[1]]} × ${lineQty[2]}`;

  const discount = text.match(/^(\d+)% OFF$/);
  if (discount) return `${discount[1]}% ರಿಯಾಯಿತಿ`;
  const order = text.match(/^Order (.+)$/);
  if (order) return `ಆರ್ಡರ್ ${order[1]}`;
  const cancellation = text.match(/^Cancel available for (.+)$/);
  if (cancellation) return `ರದ್ದುಮಾಡಲು ಲಭ್ಯವಿರುವ ಸಮಯ ${cancellation[1]}`;
  const addItem = text.match(/^Add one (.+)$/);
  if (addItem) return `${addItem[1]} ಸೇರಿಸಿ`;
  const removeItem = text.match(/^Remove one (.+)$/);
  if (removeItem) return `${removeItem[1]} ತೆಗೆದುಹಾಕಿ`;
  return undefined;
}

async function setLanguage(language) {
  const next = language === 'kn' ? 'kn' : 'en';
  LS.setItem(LANGUAGE_KEY, next);
  SS.setItem(LANGUAGE_PROMPT_KEY, '1');
  closeLanguagePrompt();
  applyPreferredLanguage();
  if (state.route === 'home') {
    renderHome();
    applyPreferredLanguage();
  }
  if (next === 'kn' && state.productsLoaded) {
    await loadKannadaProductTranslations();
  }
}

// Keep the header English / ಕನ್ನಡ switch in step with the chosen language
function syncLanguageToggle() {
  const language = getPreferredLanguage();
  const toggle = document.querySelector('.lang-toggle');
  if (!toggle) return;
  toggle.classList.toggle('is-kn', language === 'kn');
  toggle.querySelectorAll('.lang-opt').forEach((btn) => {
    const active = btn.getAttribute('data-lang') === language;
    if (btn.getAttribute('aria-pressed') !== String(active)) btn.setAttribute('aria-pressed', String(active));
  });
}

function applyPreferredLanguage() {
  syncLanguageToggle();
  const language = getPreferredLanguage();
  document.documentElement.lang = language;
  document.title = language === 'kn'
    ? 'ಕಾಮಗೆರೆ ಮಾರ್ಟ್ — ತಾಜಾ ಅಗತ್ಯ ವಸ್ತುಗಳು ಮನೆಗೆ'
    : 'Kamagere Mart — Fresh essentials delivered';
  const app = document.getElementById('app');
  if (app) {
    const walker = document.createTreeWalker(app, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const original = node.nodeValue.trim();
      if (!original) continue;
      const translated = translateAppText(original, language);
      // Skip text that is already in the right language: re-writing it would wake the
      // MutationObserver again and loop forever (e.g. the phone number on the Contact page).
      if (translated && translated !== original) {
        const leading = node.nodeValue.match(/^\s*/)?.[0] || '';
        const trailing = node.nodeValue.match(/\s*$/)?.[0] || '';
        node.nodeValue = `${leading}${translated}${trailing}`;
      }
    }
    for (const element of app.querySelectorAll('[placeholder], [aria-label], [title], [alt]')) {
      for (const attribute of ['placeholder', 'aria-label', 'title', 'alt']) {
        const value = element.getAttribute(attribute);
        if (!value) continue;
        const translated = translateAppText(value, language);
        if (translated && translated !== value) element.setAttribute(attribute, translated);
      }
    }
  }
}

async function renderAdminDashboard() {
  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;

  pageContent.innerHTML = '<div class="card"><p>Loading admin dashboard…</p></div>';
  const token = getAdminToken();
  if (!token) {
    setRoute('auth');
    return;
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };
    const [ordersResponse, productsResponse, storeLocationResponse] = await Promise.all([
      fetch(`${API_BASE}/api/orders`, { headers }),
      fetch(`${API_BASE}/api/products`),
      fetch(`${API_BASE}/api/store-location`)
    ]);
    const result = await ordersResponse.json();
    const productResult = await productsResponse.json();
    const storeLocationResult = await storeLocationResponse.json();

    if (ordersResponse.status === 401 || ordersResponse.status === 403) {
      logoutAdmin(false);
      showToast('Your admin session expired. Please sign in again.');
      return;
    }
    if (!ordersResponse.ok) {
      throw new Error(result.message || 'Could not load orders.');
    }
    if (!Array.isArray(result)) {
      throw new Error('The server returned an invalid orders response.');
    }
    if (!productsResponse.ok || !Array.isArray(productResult)) {
      throw new Error(productResult.message || 'Could not load products.');
    }
    if (!storeLocationResponse.ok || !storeLocationResult.storeLocation) {
      throw new Error(storeLocationResult.message || 'Could not load store location.');
    }
    state.storeLocation = storeLocationResult.storeLocation;
    state.products = productResult;

    const totalSales = result.reduce((sum, order) => sum + Number(order.total || 0), 0);
    pageContent.innerHTML = `
      <section class="admin-dashboard">
        <div class="admin-heading">
          <div>
            <p class="eyebrow">Store management</p>
            <h1>Admin dashboard</h1>
            <p>Signed in as ${escapeHtml(getAdminEmail() || 'Administrator')}</p>
          </div>
          <div class="admin-heading-actions">
            <button class="outline-btn" data-action="admin-refresh">Refresh data</button>
            <button class="outline-btn" data-action="admin-logout">Sign out</button>
          </div>
        </div>
        <div class="admin-stats">
          <div class="stat-box"><span>Total orders</span><strong>${result.length}</strong></div>
          <div class="stat-box"><span>Order value</span><strong>₹${totalSales.toLocaleString('en-IN')}</strong></div>
          <div class="stat-box"><span>Products</span><strong>${productResult.length}</strong></div>
          <div class="stat-box"><span>Units in stock</span><strong id="admin-total-stock">${productResult.reduce((sum, product) => sum + getStock(product), 0)}</strong></div>
          <div class="stat-box"><span>Sold out</span><strong id="admin-sold-out-count">${productResult.filter(isSoldOut).length}</strong></div>
        </div>
        <section class="card admin-products">
          <h2>Store location</h2>
          <p>Set the starting point used for customer delivery routes and Google Maps tracking.</p>
          <form data-form-type="admin-store-location" class="form-grid">
            <div>
              <label for="admin-store-location">Store address used for delivery directions</label>
              <input id="admin-store-location" name="storeLocation" maxlength="500" value="${escapeHtml(state.storeLocation)}" required />
            </div>
            <button type="submit" class="primary-btn" style="width:fit-content;">Save store location</button>
          </form>
        </section>
        <section class="card admin-products">
          <h2 id="product-form-heading">Add a product</h2>
          <p>New products are saved to the store database and appear in the storefront catalog.</p>
          <form data-form-type="add-product" class="form-grid admin-product-form">
            <div class="form-row">
              <div>
                <label for="product-name">Product name</label>
                <input id="product-name" name="name" maxlength="255" required />
              </div>
              <div>
                <label for="product-category">Category</label>
                <select id="product-category" name="category" required>
                  ${window.KM_DATA.categories.filter((category) => category !== 'All').map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div>
                <label for="product-unit">Pack size / unit</label>
                <input id="product-unit" name="unit" maxlength="100" placeholder="e.g. 1 kg" required />
              </div>
              <div>
                <label for="product-price">Selling price (₹)</label>
                <input id="product-price" name="price" type="number" min="0.01" step="0.01" required />
              </div>
              <div>
                <label for="product-old-price">MRP (₹)</label>
                <input id="product-old-price" name="oldPrice" type="number" min="0.01" step="0.01" required />
              </div>
              <div>
                <label for="product-stock">Stock quantity</label>
                <input id="product-stock" name="stock" type="number" min="0" step="1" value="20" required />
              </div>
            </div>
            <div>
              <label for="product-description">Description</label>
              <textarea id="product-description" name="description" maxlength="2000" required></textarea>
            </div>
            <div>
              <label for="product-image">Image URL (optional, HTTPS)</label>
              <input id="product-image" name="image" type="url" placeholder="https://..." />
            </div>
            <div>
              <label for="product-image-file">Take or choose a product photo</label>
              <input id="product-image-file" name="image-file" type="file" accept="image/*" capture="environment" />
              <p class="admin-form-hint">On supported phones this opens the rear camera. Photos are resized before saving.</p>
              <img id="product-image-preview" class="admin-image-preview" alt="Product photo preview" hidden />
            </div>
            <button type="submit" class="primary-btn">Add product</button>
            <button type="button" class="outline-btn" data-action="cancel-product-edit" hidden>Cancel editing</button>
            <p class="admin-form-message" role="status" aria-live="polite"></p>
          </form>
        </section>
        <section class="card admin-products">
          <div class="admin-section-head">
            <h2>Store products</h2>
            <button type="button" class="outline-btn" data-action="restore-defaults">Restore default products</button>
          </div>
          <p>Stock drops automatically when customers order. Set a new quantity to restock, or remove a product from the store.</p>
          ${productResult.length ? `
          <div class="admin-product-list">
            ${productResult.map((product) => `
              <div class="admin-product-row ${isSoldOut(product) ? 'is-sold-out' : ''}" data-product-row="${Number(product.id)}">
                <img class="admin-product-thumb" src="${escapeHtml(product.image)}" alt="" />
                <span class="admin-product-name">${escapeHtml(product.name)}</span>
                <span class="admin-product-meta"><span>${escapeHtml(product.category)}</span> · ${escapeHtml(product.unit)}</span>
                <strong class="admin-product-price">₹${Number(product.price).toLocaleString('en-IN')}</strong>
                <div class="admin-stock">
                  <span class="stock-pill ${isSoldOut(product) ? 'is-out' : ''}" data-stock-pill="${Number(product.id)}">${isSoldOut(product) ? 'Sold out' : `In stock: ${getStock(product)}`}</span>
                  <input class="admin-stock-input" type="number" min="0" step="1" value="${getStock(product)}" data-stock-input="${Number(product.id)}" aria-label="Stock quantity for ${escapeHtml(product.name)}" />
                  <button type="button" class="outline-btn" data-action="set-stock" data-product-id="${Number(product.id)}">Update stock</button>
                </div>
                <div class="admin-row-actions">
                  <button type="button" class="outline-btn" data-action="edit-product" data-product-id="${Number(product.id)}">Edit</button>
                  <button type="button" class="outline-btn danger-btn" data-action="delete-product" data-product-id="${Number(product.id)}">Remove</button>
                </div>
              </div>
            `).join('')}
          </div>
          ` : '<p>There are no products in the store. Add one above or restore the default products.</p>'}
        </section>
        <section class="card admin-orders" id="admin-orders">
          <h2>Recent orders</h2>
          ${result.length ? `
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Address</th><th>Payment</th><th>Status</th><th>Total</th></tr></thead>
                <tbody>
                  ${result.map((order) => `
                    <tr>
                      <td>${escapeHtml(order.id || '')}</td>
                      <td>${escapeHtml(order.date || '')}</td>
                      <td>${escapeHtml(order.customerName || '')}<br>${escapeHtml(order.customerPhone || '')}<br>${escapeHtml(order.customerEmail || '')}</td>
                      <td>${(order.items || []).map((item) => `${escapeHtml(item.name || 'Item')} × ${Number(item.quantity || 0)}`).join('<br>')}</td>
                      <td>${escapeHtml(order.address || '')}</td>
                      <td>${escapeHtml(order.payment || '')}</td>
                      <td>
                        <select class="admin-order-status" aria-label="Update status for order ${escapeHtml(order.id || '')}" data-action="update-order-status" data-order-id="${escapeHtml(order.id || '')}" data-previous-status="${escapeHtml(order.status || 'Confirmed')}">
                          ${['Confirmed', 'Preparing', 'Out for delivery', 'Delivered'].map((status) => `<option value="${status}" ${status === (order.status || 'Confirmed') ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}
                          ${order.status === 'Cancelled' ? '<option value="Cancelled" selected>Cancelled</option>' : ''}
                        </select>
                      </td>
                      <td>₹${Number(order.total || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p>No orders have been placed yet.</p>'}
        </section>
      </section>
    `;
    startAdminStockPolling();
  } catch (error) {
    console.error('Unable to load admin dashboard', error);
    pageContent.innerHTML = `
      <div class="empty-state">
        <h2>Could not load admin dashboard</h2>
        <p>${escapeHtml(error.message || 'Please try again.')}</p>
        <button class="primary-btn" data-action="admin-retry">Retry</button>
      </div>
    `;
  }
}

function renderOrders() {
  if (state.ordersRefreshTimer) {
    clearInterval(state.ordersRefreshTimer);
    state.ordersRefreshTimer = null;
  }
  if (state.orderTrackingRefreshTimer) {
    clearInterval(state.orderTrackingRefreshTimer);
    state.orderTrackingRefreshTimer = null;
  }
  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;

  const orders = state.orders.length ? state.orders : [];

  if (!orders.length) {
    pageContent.innerHTML = `
      <div class="empty-state">
        <h2>No orders yet</h2>
        <p>Place your first order and it will appear here.</p>
        <button class="primary-btn" data-route="home">Start shopping</button>
      </div>
    `;
    return;
  }

  pageContent.innerHTML = `
    <div class="orders-list">
      ${orders.map((order) => `
        <div class="order-card">
          <div class="order-header">
            <strong>Order ${escapeHtml(order.id || 'KM-000')}</strong>
            <span class="pill">${escapeHtml(order.status || 'Confirmed')}</span>
          </div>
          <div class="order-meta">
            ${escapeHtml(order.date || 'Today')} · ${escapeHtml(order.payment || 'COD')} · ₹${Number(order.total || 0).toLocaleString('en-IN')}
          </div>
          ${renderOrderTracking(order)}
          ${(order.customerName || order.customerPhone || order.customerEmail || order.address) ? `
            <div class="order-meta">
              ${order.customerName ? `<div>${escapeHtml(order.customerName)}</div>` : ''}
              ${order.customerPhone ? `<div>${escapeHtml(order.customerPhone)}</div>` : ''}
              ${order.customerEmail ? `<div>${escapeHtml(order.customerEmail)}</div>` : ''}
              ${order.address ? `<div>${escapeHtml(order.address)}</div>` : ''}
            </div>
          ` : ''}
          <div style="margin-top:12px;">
            ${order.items ? order.items.map((item) => `
              <div class="summary-line"><span>${escapeHtml(item.name || item.product?.name || 'Item')} × ${Number(item.quantity || 1)}</span><strong>₹${(Number(item.price || item.product?.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}</strong></div>
            `).join('') : ''}
          </div>
          ${order.status === 'Confirmed' && order.cancelToken && Number.isFinite(Number(order.createdAt)) ? `
            <div class="order-cancel-actions">
              <button class="outline-btn" type="button" data-action="cancel-order" data-order-id="${escapeHtml(order.id)}">Cancel order</button>
              <span class="cancel-window" data-cancel-countdown="${escapeHtml(order.id)}"></span>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;

  updateOrderCancellationCountdowns();
  state.ordersRefreshTimer = setInterval(updateOrderCancellationCountdowns, 1000);
  refreshTrackedOrderStatuses();
  state.orderTrackingRefreshTimer = setInterval(refreshTrackedOrderStatuses, 15000);
}

function renderOrderTracking(order) {
  if (order.status === 'Cancelled') {
    return '<div class="order-tracking"><strong>Order tracking</strong><p>This order was cancelled.</p></div>';
  }

  const stages = ['Confirmed', 'Preparing', 'Out for delivery', 'Delivered'];
  const currentStage = stages.indexOf(order.status || 'Confirmed');
  const route = getOrderMapRoute(order);
  return `
    <section class="order-tracking" aria-label="Order tracking">
      <strong>Track order</strong>
      <ol class="tracking-steps">
        ${stages.map((stage, index) => `
          <li class="tracking-step${index <= currentStage ? ' is-complete' : ''}${index === currentStage ? ' is-current' : ''}">
            <span class="tracking-step-marker" aria-hidden="true"></span>
            <span>${escapeHtml(stage)}</span>
          </li>
        `).join('')}
      </ol>
      ${route ? `
        <p class="tracking-map-caption">Delivery route from store to your address.</p>
        ${route.embedUrl
          ? `<iframe class="tracking-map" title="Google Maps delivery route for order ${escapeHtml(order.id || '')}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${escapeHtml(route.embedUrl)}"></iframe>`
          : '<p class="tracking-map-note">Open the route in Google Maps to view turn-by-turn directions.</p>'}
        <div class="tracking-map-actions">
          <a class="outline-btn" href="${escapeHtml(route.mapsUrl)}" target="_blank" rel="noopener noreferrer">Open delivery route in Google Maps</a>
          <button class="secondary-btn" type="button" data-action="share-order-tracking" data-order-id="${escapeHtml(order.id || '')}">Share tracking</button>
        </div>
      ` : ''}
      ${order.trackingToken ? '<p class="tracking-refresh-note">Status refreshes automatically.</p>' : ''}
    </section>
  `;
}

function getOrderMapRoute(order) {
  if (!order.address || !state.storeLocation) return null;
  const destination = getOrderDestination(order.address);
  if (!destination) return null;

  const mapsUrl = new URL('https://www.google.com/maps/dir/');
  mapsUrl.searchParams.set('api', '1');
  mapsUrl.searchParams.set('origin', state.storeLocation);
  mapsUrl.searchParams.set('destination', destination);
  mapsUrl.searchParams.set('travelmode', 'driving');

  const embedUrl = new URL('https://maps.google.com/maps');
  embedUrl.searchParams.set('saddr', state.storeLocation);
  embedUrl.searchParams.set('daddr', destination);
  embedUrl.searchParams.set('dirflg', 'd');
  embedUrl.searchParams.set('output', 'embed');
  return { mapsUrl: mapsUrl.toString(), embedUrl: embedUrl.toString() };
}

async function shareOrderTracking(orderId) {
  const order = state.orders.find((item) => String(item.id) === String(orderId));
  const route = order && getOrderMapRoute(order);
  if (!order || !route) {
    showToast('A delivery address is required to share order tracking.');
    return;
  }

  const shareData = {
    title: `Kamagere Mart order ${order.id}`,
    text: `Order ${order.id} status: ${order.status || 'Confirmed'}. Delivery route from ${state.storeLocation} to ${getOrderDestination(order.address)}.`,
    url: route.mapsUrl
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      showToast('Tracking details copied to clipboard.');
      return;
    }
    window.prompt('Copy the order tracking link:', route.mapsUrl);
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Unable to share order tracking:', error);
      showToast('Unable to share tracking. Please try again.');
    }
  }
}

function getOrderDestination(address) {
  const text = String(address || '').trim();
  const locationLink = text.match(/Current location:\s*(https?:\/\/\S+)/i);
  if (!locationLink) return text;
  try {
    const locationUrl = new URL(locationLink[1].replace(/[),.;]+$/, ''));
    const query = locationUrl.searchParams.get('q') || locationUrl.searchParams.get('query');
    if (query && /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(query)) {
      return query.replace(/\s+/g, '');
    }
  } catch (error) {
    console.error('Unable to parse delivery location link:', error);
  }
  return text.replace(/Current location:.*$/im, '').trim();
}

async function refreshTrackedOrderStatuses() {
  const trackedOrders = state.orders.filter((order) => order.trackingToken && order.status !== 'Cancelled');
  if (!trackedOrders.length) return;

  let statusChanged = false;
  await Promise.all(trackedOrders.map(async (order) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(order.id)}/track`, {
        headers: { Authorization: `Bearer ${order.trackingToken}` }
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Unable to refresh order tracking.');
      }
      if (result.status && result.status !== order.status) {
        order.status = result.status;
        statusChanged = true;
      }
    } catch (error) {
      console.error(`Unable to refresh tracking for order ${order.id}:`, error);
    }
  }));

  if (statusChanged) {
    LS.setItem(ORDERS_KEY, JSON.stringify(state.orders));
    renderOrders();
  }
}

async function loadStoreLocation() {
  try {
    const response = await fetch(`${API_BASE}/api/store-location`);
    const result = await response.json();
    if (!response.ok || !result.storeLocation) {
      throw new Error(result.message || 'Unable to load store location.');
    }
    state.storeLocation = result.storeLocation;
    if (state.route === 'orders' && !isAdminSession()) renderOrders();
  } catch (error) {
    console.error('Unable to load store location:', error);
    showToast(error.message || 'Unable to load store location.');
  }
}

async function handleStoreLocationUpdate(form) {
  const token = getAdminToken();
  if (!token) {
    showToast('Your admin session expired. Please sign in again.');
    return;
  }
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/admin/store-location`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ storeLocation: new FormData(form).get('storeLocation') })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Unable to update store location.');
    }
    state.storeLocation = result.storeLocation;
    showToast('Store location updated.');
    await renderAdminDashboard();
  } catch (error) {
    if (submitButton) submitButton.disabled = false;
    showToast(error.message || 'Unable to update store location.');
  }
}

async function handleAdminOrderStatusUpdate(select) {
  const previousStatus = select.dataset.previousStatus || 'Confirmed';
  const orderId = select.dataset.orderId;
  const token = getAdminToken();
  if (!token || !orderId) {
    select.value = previousStatus;
    showToast('Your admin session expired. Please sign in again.');
    return;
  }

  select.disabled = true;
  try {
    const response = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: select.value })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Unable to update order status.');
    }
    showToast(`Order ${orderId}: ${result.status}`);
    await renderAdminDashboard();
  } catch (error) {
    select.value = previousStatus;
    select.disabled = false;
    showToast(error.message || 'Unable to update order status.');
  }
}

function updateOrderCancellationCountdowns() {
  const ordersById = new Map(state.orders.map((order) => [String(order.id), order]));
  document.querySelectorAll('[data-action="cancel-order"]').forEach((button) => {
    const order = ordersById.get(button.getAttribute('data-order-id'));
    const remainingMs = order ? 2 * 60 * 1000 - (Date.now() - Number(order.createdAt)) : 0;
    const canCancel = Boolean(order?.cancelToken) && order.status === 'Confirmed' && remainingMs > 0;
    button.hidden = !canCancel;
    const countdown = document.querySelector(`[data-cancel-countdown="${CSS.escape(button.getAttribute('data-order-id'))}"]`);
    if (countdown) {
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      countdown.textContent = canCancel
        ? `Cancel available for ${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`
        : 'Cancellation window expired';
    }
  });
}

async function cancelOrder(orderId) {
  const order = state.orders.find((item) => String(item.id) === String(orderId));
  if (!order?.cancelToken) {
    showToast('Cancellation details are not available for this order');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(order.id)}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelToken: order.cancelToken })
    });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 410) {
        order.cancelToken = '';
        LS.setItem(ORDERS_KEY, JSON.stringify(state.orders));
        renderOrders();
      }
      throw new Error(result.message || 'Unable to cancel order.');
    }

    order.status = result.status || 'Cancelled';
    order.cancelToken = '';
    LS.setItem(ORDERS_KEY, JSON.stringify(state.orders));
    showToast('Order cancelled successfully');
    renderOrders();
  } catch (error) {
    showToast(error.message || 'Unable to cancel order.');
  }
}

function renderProfile() {
  const pageContent = document.getElementById('page-content');
  if (!pageContent) return;

  const user = state.user;

  if (!user && getAdminToken()) {
    pageContent.innerHTML = `
      <div class="profile-box">
        <div class="card">
          <h3>My profile</h3>
          <p><span>Signed in as administrator</span> <strong>${escapeHtml(getAdminEmail() || 'Administrator')}</strong></p>
          <p>You can open any page in the store.</p>
          <div class="profile-actions">
            <button type="button" class="primary-btn" data-route="admin">Admin dashboard</button>
            <button type="button" class="outline-btn" data-action="admin-logout">Sign out</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (!user) {
    pageContent.innerHTML = `
      <div class="empty-state">
        <h2>You are not logged in</h2>
        <p>Sign in to access your account and order history.</p>
        <button class="primary-btn" data-route="auth">Login</button>
      </div>
    `;
    return;
  }

  pageContent.innerHTML = `
    <div class="profile-box">
      <div class="card">
        <h3>My profile</h3>
        <form class="profile-form" data-form-type="profile">
          <div class="profile-photo-section">
            <div class="profile-avatar">
              <img id="profile-photo-preview" src="${escapeHtml(user.profileImage || 'images/shara-technovate-logo.png')}" alt="Profile photo" />
              <span id="profile-photo-initials" hidden>${escapeHtml((user.name || '?').trim().charAt(0).toUpperCase())}</span>
            </div>
            <label class="profile-photo-upload" id="profile-photo-upload" for="profile-image-file" hidden>
              Change profile photo
              <input id="profile-image-file" type="file" accept="image/*" hidden disabled />
            </label>
          </div>
          <div class="profile-fields">
            <div>
              <label for="profile-name">Full name</label>
              <input id="profile-name" name="name" maxlength="255" value="${escapeHtml(user.name || '')}" required disabled />
            </div>
            <div>
              <label for="profile-email">Email</label>
              <input id="profile-email" name="email" type="email" value="${escapeHtml(user.email || '')}" required disabled />
            </div>
            <div>
              <label for="profile-phone">Phone</label>
              <input id="profile-phone" name="phone" type="tel" pattern="[6-9][0-9]{9}" title="Enter a 10-digit Indian mobile number" value="${escapeHtml(user.phone || '')}" required disabled />
            </div>
            <div>
              <label for="profile-address">Address</label>
              <textarea id="profile-address" name="address" maxlength="2000" disabled>${escapeHtml(user.address || '')}</textarea>
            </div>
          </div>
          <div class="profile-actions">
            <button type="button" class="primary-btn" data-action="edit-profile">Edit profile</button>
            <button type="submit" class="primary-btn" data-action="save-profile" hidden>Save changes</button>
            <button type="button" class="outline-btn" data-action="cancel-profile-edit" hidden>Cancel editing</button>
            <button type="button" class="outline-btn" data-action="logout">Logout</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function setProfileEditing(isEditing) {
  const form = document.querySelector('form[data-form-type="profile"]');
  if (!form) return;
  form.querySelectorAll('input[name], textarea[name], #profile-image-file').forEach((field) => {
    field.disabled = !isEditing;
  });
  const photoUpload = form.querySelector('#profile-photo-upload');
  if (photoUpload) photoUpload.hidden = !isEditing;
  form.querySelector('[data-action="edit-profile"]').hidden = isEditing;
  form.querySelector('[data-action="save-profile"]').hidden = !isEditing;
  form.querySelector('[data-action="cancel-profile-edit"]').hidden = !isEditing;
}

async function handleProfileUpdate(form) {
  const token = getCustomerToken();
  if (!token) {
    showToast('Please sign in again to update your profile.');
    return;
  }
  const fields = Object.fromEntries(new FormData(form).entries());
  const profileImage = form.dataset.profileImage ?? state.user.profileImage ?? '';

  try {
    const response = await fetch(`${API_BASE}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ...fields, profileImage })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Unable to update your profile.');
    }
    state.user = result.user;
    saveUser(result.user);
    showToast('Profile updated successfully.');
    renderProfile();
  } catch (error) {
    showToast(error.message || 'Unable to update your profile.');
  }
}

function handleProfileImageSelection(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    input.value = '';
    showToast('Choose an image file for your profile photo.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    input.value = '';
    showToast('This photo is too large to upload. Choose a smaller image.');
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    try {
      const maxDataUrlLength = 100000;
      const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
      const cropX = Math.floor((image.naturalWidth - cropSize) / 2);
      const cropY = Math.floor((image.naturalHeight - cropSize) / 2);
      let dataUrl = '';
      for (let dimension = 320; dimension >= 128; dimension = Math.floor(dimension * 0.8)) {
        const canvas = document.createElement('canvas');
        canvas.width = dimension;
        canvas.height = dimension;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Unable to prepare this photo.');
        context.drawImage(image, cropX, cropY, cropSize, cropSize, 0, 0, dimension, dimension);
        for (let quality = 0.75; quality >= 0.35; quality -= 0.1) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          if (dataUrl.length <= maxDataUrlLength) break;
        }
        if (dataUrl.length <= maxDataUrlLength) break;
      }
      if (dataUrl.length > maxDataUrlLength) {
        throw new Error('This photo is too large to upload. Choose a smaller image.');
      }
      const form = input.closest('[data-form-type="profile"]');
      if (!form) return;
      form.dataset.profileImage = dataUrl;
      const preview = form.querySelector('#profile-photo-preview');
      const initials = form.querySelector('#profile-photo-initials');
      preview.src = dataUrl;
      preview.hidden = false;
      initials.hidden = true;
    } catch (error) {
      input.value = '';
      showToast(error.message || 'Unable to prepare this photo.');
    }
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    input.value = '';
    showToast('Unable to open this image. Try another photo.');
  };
  image.src = objectUrl;
}

async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/api/products`);
    const data = await response.json();
    if (Array.isArray(data)) {
      state.products = data;
      state.productsLoaded = true;
    }
    if (state.route === 'home') renderHome();
    if (state.route === 'cart') renderCart();
    if (getPreferredLanguage() === 'kn') {
      void loadKannadaProductTranslations();
    }
  } catch (error) {
    console.error('Unable to load products', error);
    showToast('Unable to connect to the backend API.');
  }
}

// One login form for admin and customers. The server decides from the credentials
// which kind of account it is (result.role) and we open the matching session.
async function handleLogin(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Login failed');

    if (result.role === 'admin' && result.token && result.admin?.role === 'admin') {
      setAdminSession(result.token, result.admin.email);
      clearCustomerToken();
      LS.removeItem(USER_KEY);
      state.user = null;
      updateAccountMenu();
      updateAdminBar();
      closeRegistrationPopup();
      showToast('Admin login successful');
      setRoute('admin');
      return;
    }

    state.user = result.user;
    clearAdminSession();
    setCustomerToken(result.token);
    saveUser(result.user);
    closeRegistrationPopup();
    updateAccountMenu();
    updateAdminBar();
    showToast('Login successful');
    setTimeout(() => setRoute('home'), 500);
  } catch (error) {
    showToast(error.message || 'Login failed');
  } finally {
    if (submitButton?.isConnected) submitButton.disabled = false;
  }
}

async function handleAddProduct(form) {
  const productId = Number(form.dataset.productId);
  const isEditing = Number.isSafeInteger(productId) && productId > 0;
  const payload = Object.fromEntries(new FormData(form).entries());
  delete payload['image-file'];
  payload.image = form.dataset.imageData || payload.image || '';
  const submitButton = form.querySelector('button[type="submit"]');
  const message = form.querySelector('.admin-form-message');
  submitButton.disabled = true;
  message.textContent = 'Saving product…';
  message.classList.remove('is-error');

  try {
    const response = await fetch(`${API_BASE}/api/products${isEditing ? `/${productId}` : ''}`, {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAdminToken()}`
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (response.status === 401 || response.status === 403) {
      logoutAdmin(false);
      showToast('Your admin session expired. Please sign in again.');
      return;
    }
    if (!response.ok) {
      throw new Error(result.message || 'Unable to add product.');
    }

    showToast(isEditing ? 'Product updated' : 'Product added to the store');
    await renderAdminDashboard();
  } catch (error) {
    message.textContent = error.message || 'Unable to add product.';
    message.classList.add('is-error');
  } finally {
    if (submitButton.isConnected) submitButton.disabled = false;
  }
}

// Call an admin-only API; signs the admin out if the session has expired
async function adminApi(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAdminToken()}`
    }
  });
  const result = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    logoutAdmin(false);
    showToast('Your admin session expired. Please sign in again.');
    throw new Error('Admin session expired.');
  }
  if (!response.ok) throw new Error(result.message || 'Request failed.');
  return result;
}

async function handleDeleteProduct(productId) {
  const product = state.products.find((item) => Number(item.id) === productId);
  if (!product) return;
  const question = getPreferredLanguage() === 'kn'
    ? `ಅಂಗಡಿಯಿಂದ "${translateAppText(product.name, 'kn') || product.name}" ಅನ್ನು ತೆಗೆದುಹಾಕಬೇಕೇ? ಗ್ರಾಹಕರಿಗೆ ಇದು ಇನ್ನು ಕಾಣಿಸುವುದಿಲ್ಲ.`
    : `Remove "${product.name}" from the store? Customers will no longer see it.`;
  if (!window.confirm(question)) return;
  try {
    await adminApi(`/api/products/${productId}`, { method: 'DELETE' });
    showToast('Product removed');
    await refreshAfterProductChange();
  } catch (error) {
    if (error.message !== 'Admin session expired.') showToast(error.message || 'Unable to remove product.');
  }
}

// Re-draw whichever page the admin is on (dashboard or storefront) with fresh stock
async function refreshAfterProductChange() {
  if (state.route === 'admin') {
    await renderAdminDashboard();
  } else {
    await loadProducts();
  }
}

// Storefront quick edit: pack size and stock saved from the product card
async function handleSaveCardDetails(productId, button) {
  const packInput = document.querySelector(`[data-card-pack="${productId}"]`);
  const stockInput = document.querySelector(`[data-card-stock="${productId}"]`);
  if (!(packInput instanceof HTMLInputElement) || !(stockInput instanceof HTMLInputElement)) return;
  const unit = packInput.value.trim();
  const stock = Number(stockInput.value);
  if (!unit) {
    showToast('Enter a pack size.');
    return;
  }
  if (stockInput.value === '' || !Number.isSafeInteger(stock) || stock < 0) {
    showToast('Enter a whole number of 0 or more.');
    return;
  }
  button.disabled = true;
  try {
    await adminApi(`/api/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ unit, stock })
    });
    showToast('Product updated');
    await refreshAfterProductChange();
  } catch (error) {
    if (error.message !== 'Admin session expired.') showToast(error.message || 'Unable to update product.');
  } finally {
    if (button.isConnected) button.disabled = false;
  }
}

async function handleSetStock(productId, button) {
  const input = document.querySelector(`[data-stock-input="${productId}"]`);
  if (!(input instanceof HTMLInputElement)) return;
  const stock = Number(input.value);
  if (input.value === '' || !Number.isSafeInteger(stock) || stock < 0) {
    showToast('Enter a whole number of 0 or more.');
    return;
  }
  button.disabled = true;
  try {
    await adminApi(`/api/products/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock })
    });
    showToast('Stock updated');
    await refreshAfterProductChange();
  } catch (error) {
    if (error.message !== 'Admin session expired.') showToast(error.message || 'Unable to update stock.');
  } finally {
    if (button.isConnected) button.disabled = false;
  }
}

async function handleRestoreDefaults() {
  try {
    const result = await adminApi('/api/admin/products/restore-defaults', { method: 'POST', body: '{}' });
    showToast(result.message || 'Products reloaded');
    await renderAdminDashboard();
  } catch (error) {
    if (error.message !== 'Admin session expired.') showToast(error.message || 'Unable to restore products.');
  }
}

// Keep the storefront's stock fresh while the page is open
function startProductPolling() {
  if (state.productsRefreshTimer) return;
  state.productsRefreshTimer = setInterval(() => {
    if (document.hidden || !['home', 'cart'].includes(state.route)) return;
    if (state.route === 'home' && getAdminToken()) return;
    const active = document.activeElement;
    if (active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName)) return;
    loadProducts();
  }, 20000);
}

// Update the admin stock figures in place (no full re-render, so forms keep their content)
function startAdminStockPolling() {
  if (state.adminStockTimer) clearInterval(state.adminStockTimer);
  state.adminStockTimer = setInterval(async () => {
    if (state.route !== 'admin' || document.hidden) return;
    try {
      const response = await fetch(`${API_BASE}/api/products`);
      const products = await response.json();
      if (!response.ok || !Array.isArray(products)) return;
      state.products = products;
      // A product was added or removed elsewhere: rebuild only if nothing is being typed
      const rows = document.querySelectorAll('[data-product-row]');
      const active = document.activeElement;
      const typing = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
      if (rows.length !== products.length) {
        if (!typing) renderAdminDashboard();
        return;
      }
      for (const product of products) {
        const pill = document.querySelector(`[data-stock-pill="${product.id}"]`);
        if (!pill) continue;
        pill.textContent = isSoldOut(product) ? 'Sold out' : `In stock: ${getStock(product)}`;
        pill.classList.toggle('is-out', isSoldOut(product));
        pill.closest('[data-product-row]')?.classList.toggle('is-sold-out', isSoldOut(product));
        const input = document.querySelector(`[data-stock-input="${product.id}"]`);
        if (input && input !== document.activeElement) input.value = getStock(product);
      }
      const total = document.getElementById('admin-total-stock');
      if (total) total.textContent = products.reduce((sum, product) => sum + getStock(product), 0);
      const soldOut = document.getElementById('admin-sold-out-count');
      if (soldOut) soldOut.textContent = products.filter(isSoldOut).length;
    } catch (error) {
      console.error('Unable to refresh admin stock', error);
    }
  }, 10000);
}

function editProduct(productId) {
  const product = state.products.find((item) => Number(item.id) === productId);
  const form = document.querySelector('[data-form-type="add-product"]');
  if (!product || !form) return;

  form.dataset.productId = String(product.id);
  form.dataset.imageData = product.image?.startsWith('data:image/jpeg;base64,') ? product.image : '';
  form.elements.namedItem('name').value = product.name;
  form.elements.namedItem('category').value = product.category;
  form.elements.namedItem('unit').value = product.unit;
  form.elements.namedItem('price').value = product.price;
  form.elements.namedItem('oldPrice').value = product.oldPrice;
  form.elements.namedItem('description').value = product.description;
  form.elements.namedItem('stock').value = Number.isFinite(getStock(product)) ? getStock(product) : 0;
  form.elements.namedItem('image').value = product.image?.startsWith('https://') ? product.image : '';
  form.elements.namedItem('image-file').value = '';

  const preview = document.getElementById('product-image-preview');
  const previewSource = form.dataset.imageData || form.elements.namedItem('image').value;
  if (previewSource) {
    preview.src = previewSource;
    preview.hidden = false;
  } else {
    preview.hidden = true;
    preview.removeAttribute('src');
  }
  document.getElementById('product-form-heading').textContent = `Update ${product.name}`;
  form.querySelector('button[type="submit"]').textContent = 'Save changes';
  form.querySelector('[data-action="cancel-product-edit"]').hidden = false;
  form.querySelector('.admin-form-message').textContent = '';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetProductForm() {
  const form = document.querySelector('[data-form-type="add-product"]');
  if (!form) return;
  form.reset();
  delete form.dataset.productId;
  form.dataset.imageData = '';
  document.getElementById('product-form-heading').textContent = 'Add a product';
  form.querySelector('button[type="submit"]').textContent = 'Add product';
  form.querySelector('[data-action="cancel-product-edit"]').hidden = true;
  form.querySelector('.admin-form-message').textContent = '';
  updateProductImagePreview('');
}

function updateProductImagePreview(source) {
  const preview = document.getElementById('product-image-preview');
  if (!preview) return;
  if (!source) {
    preview.hidden = true;
    preview.removeAttribute('src');
    return;
  }
  preview.src = source;
  preview.hidden = false;
}

function handleProductImageSelection(input) {
  const form = input.closest('[data-form-type="add-product"]');
  const file = input.files?.[0];
  if (!form || !file) return;

  if (!file.type.startsWith('image/')) {
    input.value = '';
    showProductImageError(form, 'Choose a valid image file.');
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    try {
      const maxDataUrlLength = 50000;
      let dataUrl = '';
      for (let dimension = 640; dimension >= 160; dimension = Math.floor(dimension * 0.8)) {
        const scale = Math.min(1, dimension / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        for (let quality = 0.75; quality >= 0.35; quality -= 0.1) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          if (dataUrl.length <= maxDataUrlLength) break;
        }
        if (dataUrl.length <= maxDataUrlLength) break;
      }
      if (dataUrl.length > maxDataUrlLength) {
        throw new Error('This photo is too large to save. Choose a smaller photo and try again.');
      }
      form.dataset.imageData = dataUrl;
      form.elements.namedItem('image').value = '';
      updateProductImagePreview(dataUrl);
      form.querySelector('.admin-form-message').textContent = 'Photo ready to save.';
      form.querySelector('.admin-form-message').classList.remove('is-error');
    } catch (error) {
      input.value = '';
      showProductImageError(form, error.message || 'Unable to prepare this photo.');
    }
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    input.value = '';
    showProductImageError(form, 'Unable to open this image. Try another photo.');
  };
  image.src = objectUrl;
}

function showProductImageError(form, message) {
  const status = form.querySelector('.admin-form-message');
  status.textContent = message;
  status.classList.add('is-error');
}

async function handleRegister(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  const isPopup = Boolean(form.closest('#registration-modal'));

  try {
    const response = await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }

    showToast('Registration successful');
    if (isPopup) {
      closeRegistrationPopup();
      showRegistrationPopup('login');
    } else {
      renderAuth('login');
    }
  } catch (error) {
    showToast(error.message || 'Registration failed');
  }
}

async function handleCheckout(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  const items = state.checkoutMode === 'buy-now' ? getBuyNowItems() : getCartItems();
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const delivery = subtotal >= 199 ? 0 : 25;
  const total = subtotal + delivery;

  if (!items.length) {
    showToast('No items in cart');
    return;
  }

  const unavailable = items.find(({ product, quantity }) => quantity > getStock(product));
  if (unavailable) {
    showToast(isSoldOut(unavailable.product)
      ? `${unavailable.product.name} is sold out.`
      : `Only ${getStock(unavailable.product)} of ${unavailable.product.name} left.`);
    return;
  }

  const orderPayload = {
    userId: state.user?.id || null,
    customerName: String(payload.name || '').trim(),
    customerPhone: String(payload.phone || '').trim(),
    customerEmail: String(payload.email || '').trim(),
    items: items.map(({ product, quantity }) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      quantity
    })),
    subtotal,
    delivery,
    total,
    address: payload.address,
    payment: payload.payment || 'COD',
    source: state.checkoutMode === 'buy-now' ? 'Buy Now' : 'Cart'
  };

  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Order failed');
    }

    if (state.checkoutMode === 'cart') {
      LS.removeItem(CART_KEY);
      state.cart = [];
      updateCartBadge();
    } else {
      LS.removeItem(BUY_NOW_KEY);
      state.checkoutMode = 'cart';
    }

    const order = result.order || {
      id: `KM-${Date.now().toString().slice(-7)}`,
      status: 'Confirmed',
      items: orderPayload.items,
      total,
      date: new Date().toLocaleString('en-IN'),
      payment: orderPayload.payment,
      trackingToken: ''
    };

    const existingOrders = loadOrders();
    existingOrders.unshift(order);
    LS.setItem(ORDERS_KEY, JSON.stringify(existingOrders));
    state.orders = existingOrders;

    showOrderSuccess(order);
    loadProducts();
  } catch (error) {
    showToast(error.message || 'Order placement failed');
    // Stock may have changed since the page loaded; refresh the counts
    loadProducts();
  }
}

function useCurrentLocation() {
  const addressField = document.getElementById('address');
  const status = document.getElementById('location-status');
  const map = document.getElementById('location-map');
  const mapFrame = map?.querySelector('iframe');
  const mapLink = document.getElementById('location-map-link');

  if (!addressField || !status || !map || !mapFrame || !mapLink) return;

  if (!navigator.geolocation) {
    status.textContent = 'Current location is not supported by this browser. Enter your address manually.';
    showToast('Current location is not supported by this browser');
    return;
  }

  status.textContent = 'Getting your current location…';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const coordinates = `${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`;
      const mapsUrl = `https://www.google.com/maps?q=${coordinates}`;
      const addressLines = addressField.value
        .split('\n')
        .filter((line) => !line.startsWith('Current location:'));
      addressField.value = [...addressLines, `Current location: ${mapsUrl}`].filter(Boolean).join('\n');
      mapFrame.src = `https://maps.google.com/maps?q=${encodeURIComponent(coordinates)}&z=16&output=embed`;
      mapLink.href = mapsUrl;
      map.hidden = false;
      status.textContent = 'Current location selected. Add your house, street, or landmark details above if needed.';
    },
    (error) => {
      const messages = {
        1: 'Location permission was denied. Allow location access or enter your address manually.',
        2: 'Your current location could not be determined. Try again or enter your address manually.',
        3: 'Location request timed out. Try again or enter your address manually.'
      };
      status.textContent = messages[error.code] || 'Unable to get your current location. Enter your address manually.';
      showToast('Unable to get your current location');
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
  );
}

function addToCart(productId) {
  const product = getProductById(productId);
  if (!product) return;
  if (isSoldOut(product)) {
    showToast(`${product.name} is sold out.`);
    return;
  }

  const current = state.cart.find((item) => item.id === productId);
  if (current && current.quantity >= getStock(product)) {
    showToast(`Only ${getStock(product)} of ${product.name} available.`);
    return;
  }
  if (current) {
    current.quantity += 1;
  } else {
    state.cart.push({ id: productId, quantity: 1 });
  }

  saveCart();
  updateCartBadge();
  renderHome();
  showToast(`${product.name} added to cart`);
}

function adjustCartQuantity(productId, change) {
  const current = state.cart.find((item) => item.id === productId);
  if (!current) return;

  if (change > 0 && current.quantity >= getStock(getProductById(productId))) {
    showToast(`Only ${getStock(getProductById(productId))} available.`);
    return;
  }

  current.quantity += change;
  if (current.quantity <= 0) {
    state.cart = state.cart.filter((item) => item.id !== productId);
  }

  saveCart();
  updateCartBadge();
  if (state.route === 'home') {
    renderHome();
  } else {
    renderCart();
  }
}

function removeCartItem(productId) {
  state.cart = state.cart.filter((item) => item.id !== productId);
  saveCart();
  updateCartBadge();
  renderCart();
}

function buyNow(productId) {
  const product = getProductById(productId);
  if (!product) return;
  if (isSoldOut(product)) {
    showToast(`${product.name} is sold out.`);
    return;
  }

  LS.setItem(BUY_NOW_KEY, JSON.stringify([{ id: productId, quantity: 1 }]));
  state.checkoutMode = 'buy-now';
  showToast(`Buy now selected for ${product.name}`);
  setRoute('checkout');
}

function getVisibleProducts() {
  const search = state.searchTerm.trim().toLowerCase();
  return state.products.filter((product) => {
    const mappedCategories = window.KM_DATA.categoryMap[state.selectedCategory] || [];
    const matchesCategory =
      state.selectedCategory === 'All' ||
      product.category === state.selectedCategory ||
      mappedCategories.includes(product.category);
    const kannadaName = translateProductText(product.name);
    const kannadaCategory = translateAppText(product.category, 'kn') || product.category;
    const kannadaDescription = translateProductText(product.description);
    const matchesSearch = !search ||
      product.name.toLowerCase().includes(search) ||
      kannadaName.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search) ||
      kannadaDescription.toLowerCase().includes(search) ||
      kannadaCategory.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });
}

function getProductName(product, language = getPreferredLanguage()) {
  if (language !== 'kn') return product.name;
  const translation = state.productTranslations[product.id];
  if (translation?.sourceName === product.name) return translation.name;
  return translateProductText(product.name);
}

function getProductDescription(product, language = getPreferredLanguage()) {
  if (language !== 'kn') return product.description;
  const translation = state.productTranslations[product.id];
  if (translation?.sourceDescription === product.description) return translation.description;
  return translateProductText(product.description);
}

async function loadKannadaProductTranslations() {
  if (state.productTranslationPromise) {
    await state.productTranslationPromise;
  }

  const untranslatedProducts = state.products.filter((product) => {
    const translation = state.productTranslations[product.id];
    return translation?.sourceName !== product.name ||
      translation?.sourceDescription !== product.description;
  });
  if (!untranslatedProducts.length) return;

  const translationRequest = (async () => {
    for (let offset = 0; offset < untranslatedProducts.length; offset += 10) {
      const batch = untranslatedProducts.slice(offset, offset + 10);
      const response = await fetch(`${API_BASE}/api/product-translations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: batch.map((product) => Number(product.id)) })
      });
      const result = await response.json();
      if (!response.ok || !Array.isArray(result.translations)) {
        throw new Error(result.message || 'Unable to translate product details to Kannada.');
      }
      for (const translation of result.translations) {
        const product = batch.find((item) => Number(item.id) === Number(translation.id));
        if (!product || !translation.name || !translation.description) {
          throw new Error('Kannada translation response did not match the product catalog.');
        }
        state.productTranslations[product.id] = {
          sourceName: product.name,
          sourceDescription: product.description,
          name: translation.name,
          description: translation.description
        };
      }
    }
  })();
  state.productTranslationPromise = translationRequest;

  try {
    await translationRequest;
    if (state.route === 'home' && getPreferredLanguage() === 'kn') {
      renderHome();
      applyPreferredLanguage();
    }
  } catch (error) {
    console.error('Unable to translate product catalog to Kannada', error);
    showToast(error.message || 'Unable to translate product details to Kannada.');
  } finally {
    if (state.productTranslationPromise === translationRequest) {
      state.productTranslationPromise = null;
    }
  }
}

const PRODUCT_TERM_TRANSLATIONS = {
  'made from': 'ದಿಂದ ತಯಾರಿಸಿದ',
  'suitable for': 'ಕ್ಕೆ ಸೂಕ್ತವಾದ',
  'everyday': 'ದಿನನಿತ್ಯದ',
  'quality': 'ಗುಣಮಟ್ಟದ',
  'premium': 'ಉತ್ತಮ ಗುಣಮಟ್ಟದ',
  'fresh': 'ತಾಜಾ',
  'soft': 'ಮೃದುವಾದ',
  'crispy': 'ಕುರುಕುರಿಯಾದ',
  'spicy': 'ಖಾರವಾದ',
  'smooth': 'ಮೃದುವಾದ',
  'creamy': 'ಕೆನೆಯಂತಹ',
  'rich': 'ಸಮೃದ್ಧವಾದ',
  'long': 'ಉದ್ದನೆಯ',
  'aromatic': 'ಪರಿಮಳಯುಕ್ತ',
  'pleasant': 'ಆಹ್ಲಾದಕರವಾದ',
  'quick and easy to prepare': 'ತ್ವರಿತವಾಗಿ ಮತ್ತು ಸುಲಭವಾಗಿ ತಯಾರಿಸಬಹುದಾದ',
  'quick': 'ತ್ವರಿತ',
  'easy': 'ಸುಲಭ',
  'instant': 'ತ್ವರಿತವಾಗಿ ತಯಾರಿಸಬಹುದಾದ',
  'convenient': 'ಅನುಕೂಲಕರವಾದ',
  'classic': 'ಕ್ಲಾಸಿಕ್',
  'whole wheat': 'ಸಂಪೂರ್ಣ ಗೋಧಿ',
  'basmati rice': 'ಬಾಸ್ಮತಿ ಅಕ್ಕಿ',
  'sunflower oil': 'ಸೂರ್ಯಕಾಂತಿ ಎಣ್ಣೆ',
  'milk chocolate': 'ಹಾಲಿನ ಚಾಕೊಲೇಟ್',
  'dairy': 'ಡೈರಿ',
  'cadbery': 'ಕ್ಯಾಡ್ಬರಿ',
  'cadbury': 'ಕ್ಯಾಡ್ಬರಿ',
  'silk': 'ಸಿಲ್ಕ್',
  'bubbly': 'ಬಬ್ಲಿ',
  'mousse': 'ಮೌಸ್',
  'aashirvaad': 'ಆಶೀರ್ವಾದ್',
  'india gate': 'ಇಂಡಿಯಾ ಗೇಟ್',
  'nandini': 'ನಂದಿನಿ',
  'amul': 'ಅಮುಲ್',
  'tata': 'ಟಾಟಾ',
  'fortune': 'ಫಾರ್ಚೂನ್',
  'maggi': 'ಮ್ಯಾಗಿ',
  'parle-g': 'ಪಾರ್ಲೆ-ಜಿ',
  'surf excel': 'ಸರ್ಫ್ ಎಕ್ಸೆಲ್',
  'milky mist': 'ಮಿಲ್ಕಿ ಮಿಸ್ಟ್',
  'sunpure': 'ಸನ್‌ಪ್ಯೂರ್',
  'daawat': 'ದಾವತ್',
  'rozana': 'ರೋಜಾನಾ',
  'madhur': 'ಮಧುರ್',
  'haldiram': 'ಹಲ್ದೀರಾಮ್',
  'atta': 'ಹಿಟ್ಟು',
  'wheat': 'ಗೋಧಿ',
  'rice': 'ಅಕ್ಕಿ',
  'grains': 'ಧಾನ್ಯಗಳು',
  'grain': 'ಕಾಳು',
  'milk': 'ಹಾಲು',
  'butter': 'ಬೆಣ್ಣೆ',
  'paneer': 'ಪನೀರ್',
  'toned': 'ಟೋನ್ಡ್',
  'sugar': 'ಸಕ್ಕರೆ',
  'salt': 'ಉಪ್ಪು',
  'iodised': 'ಅಯೋಡಿನ್‌ಯುಕ್ತ',
  'refined': 'ಶುದ್ಧೀಕರಿಸಿದ',
  'oil': 'ಎಣ್ಣೆ',
  'noodles': 'ನೂಡಲ್ಸ್',
  'biscuits': 'ಬಿಸ್ಕತ್ತುಗಳು',
  'glucose': 'ಗ್ಲೂಕೋಸ್',
  'banana': 'ಬಾಳೆಹಣ್ಣು',
  'bananas': 'ಬಾಳೆಹಣ್ಣುಗಳು',
  'tomato': 'ಟೊಮೇಟೊ',
  'tomatoes': 'ಟೊಮೇಟೊಗಳು',
  'onion': 'ಈರುಳ್ಳಿ',
  'onions': 'ಈರುಳ್ಳಿಗಳು',
  'chocolate': 'ಚಾಕೊಲೇಟ್',
  'biryani': 'ಬಿರಿಯಾನಿ',
  'pulao': 'ಪುಲಾವ್',
  'chapatis': 'ಚಪಾತಿಗಳು',
  'chapati': 'ಚಪಾತಿ',
  'rotis': 'ರೊಟ್ಟಿಗಳು',
  'roti': 'ರೊಟ್ಟಿ',
  'curries': 'ಪಲ್ಯಗಳು',
  'curry': 'ಪಲ್ಯ',
  'sambar': 'ಸಾಂಬಾರ್',
  'rasam': 'ರಸಂ',
  'salads': 'ಸಲಾಡ್‌ಗಳು',
  'salad': 'ಸಲಾಡ್',
  'breakfast': 'ಉಪಾಹಾರ',
  'tea-time': 'ಚಹಾ ಸಮಯದ',
  'tea': 'ಚಹಾ',
  'coffee': 'ಕಾಫಿ',
  'snacks': 'ತಿಂಡಿಗಳು',
  'snack': 'ತಿಂಡಿ',
  'meals': 'ಊಟಗಳು',
  'meal': 'ಊಟ',
  'cooking': 'ಅಡುಗೆ',
  'frying': 'ಕರಿಯಲು',
  'baking': 'ಬೇಕಿಂಗ್',
  'drinking': 'ಕುಡಿಯಲು',
  'consumption': 'ಸೇವನೆಗೆ',
  'preparation': 'ತಯಾರಿಕೆ',
  'household': 'ಮನೆಯ',
  'food': 'ಆಹಾರ',
  'family': 'ಕುಟುಂಬದ',
  'use': 'ಬಳಕೆಗೆ',
  'washing': 'ತೊಳೆಯಲು',
  'dettol': 'ಡೆಟ್ಟಾಲ್',
  'foaming': 'ನೊರೆಯ',
  'handwash': 'ಹ್ಯಾಂಡ್‌ವಾಶ್',
  'hand wash': 'ಹ್ಯಾಂಡ್ ವಾಶ್',
  'pump': 'ಪಂಪ್',
  'strawberry': 'ಸ್ಟ್ರಾಬೆರಿ',
  '250ml': '250 ಮಿ.ಲೀ.',
  'rich foam': 'ಸಮೃದ್ಧ ನೊರೆ',
  'moisturizing': 'ತೇವಾಂಶ ಕಾಪಾಡುವ',
  'soft on hands': 'ಕೈಗಳಿಗೆ ಮೃದು',
  'laundry': 'ಬಟ್ಟೆ ಒಗೆಯುವ',
  'detergent': 'ಡಿಟರ್ಜೆಂಟ್',
  'cleaning': 'ಸ್ವಚ್ಛತೆಗೆ',
  'and': 'ಮತ್ತು',
  'with': 'ಜೊತೆಗೆ',
  'for': 'ಗಾಗಿ',
  'from': 'ದಿಂದ',
  'the': '',
  'a': '',
  'an': '',
  'that': '',
  'which': '',
  'are': '',
  'is': '',
  'to': '',
  'of': ''
};
const PRODUCT_TERM_TRANSLATION_ENTRIES = Object.entries(PRODUCT_TERM_TRANSLATIONS)
  .sort(([left], [right]) => right.length - left.length);

function translateProductText(text) {
  const exactTranslation = KN_TRANSLATIONS[text];
  if (exactTranslation) return exactTranslation;

  let translated = text;
  for (const [term, kannada] of PRODUCT_TERM_TRANSLATION_ENTRIES) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    translated = translated.replace(new RegExp(`\\b${escapedTerm}\\b`, 'gi'), kannada);
  }
  return translated.replace(/\s+([.,])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

function formatRupees(amount) {
  return Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

// Discount saving for one product line: (old price - price paid) x quantity
function getLineSavings(product, paidPrice, quantity) {
  const oldPrice = Number(product?.oldPrice) || 0;
  const paid = Number(paidPrice);
  const qty = Number(quantity) || 0;
  if (!oldPrice || !Number.isFinite(paid) || oldPrice <= paid) return 0;
  return (oldPrice - paid) * qty;
}

function calculateCartSavings(items) {
  return items.reduce((sum, item) => sum + getLineSavings(item.product, item.product.price, item.quantity), 0);
}

function calculateOrderSavings(order) {
  if (!order || order.status === 'Cancelled' || !Array.isArray(order.items)) return 0;
  return order.items.reduce((sum, item) => {
    const product = getProductById(Number(item.id));
    return sum + getLineSavings(product, item.price ?? product?.price, item.quantity);
  }, 0);
}

// Total saved from discounts: placed orders + items currently in the cart
function getTotalSavedAmount() {
  const fromOrders = (state.orders || []).reduce((sum, order) => sum + calculateOrderSavings(order), 0);
  return fromOrders + calculateCartSavings(getCartItems());
}

let activeVoiceRecognition = null;

function toggleVoiceSearch(button) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    showToast('Voice search is not supported in this browser. Please use Chrome or Edge.');
    return;
  }
  if (activeVoiceRecognition) {
    activeVoiceRecognition.stop();
    return;
  }

  const recognition = new Recognition();
  recognition.lang = getPreferredLanguage() === 'kn' ? 'kn-IN' : 'en-IN';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;
  activeVoiceRecognition = recognition;
  let transcript = '';

  recognition.onstart = () => {
    button.classList.add('listening');
    button.setAttribute('aria-pressed', 'true');
    showToast('Listening... say a product name');
  };

  recognition.onresult = (event) => {
    transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ').trim();
  };

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      showToast('Microphone access is blocked. Allow it in the browser address bar and try again.');
    } else if (event.error === 'no-speech') {
      showToast("Didn't catch that. Please try again.");
    } else if (event.error === 'network') {
      showToast('Voice search needs an internet connection.');
    } else if (event.error !== 'aborted') {
      showToast('Voice search failed. Please try again.');
    }
  };

  recognition.onend = () => {
    activeVoiceRecognition = null;
    document.querySelectorAll('.voice-btn').forEach((btn) => {
      btn.classList.remove('listening');
      btn.setAttribute('aria-pressed', 'false');
    });
    const spoken = transcript.replace(/[.,!?;:\s]+$/g, '').trim();
    if (spoken && document.querySelector('.category-section')) {
      state.searchTerm = spoken;
      renderHome();
      showToast(`Showing results for "${spoken}"`);
    }
  };

  try {
    recognition.start();
  } catch (error) {
    activeVoiceRecognition = null;
    showToast('Could not start voice search. Please try again.');
  }
}

function getCartItems() {
  return state.cart
    .map((item) => ({ ...item, product: getProductById(item.id) }))
    .filter((item) => item.product);
}

function getBuyNowItems() {
  const stored = JSON.parse(LS.getItem(BUY_NOW_KEY) || '[]');
  return stored
    .map((item) => ({ ...item, product: getProductById(item.id) }))
    .filter((item) => item.product);
}

function getProductById(productId) {
  return state.products.find((product) => product.id === productId);
}

function saveCart() {
  LS.setItem(CART_KEY, JSON.stringify(state.cart));
}

function loadCart() {
  try {
    return JSON.parse(LS.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUser(user) {
  LS.setItem(USER_KEY, JSON.stringify(user));
  updateAccountMenu();
}

function loadUser() {
  try {
    return JSON.parse(LS.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

function loadOrders() {
  try {
    return JSON.parse(LS.getItem(ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function logout() {
  LS.removeItem(USER_KEY);
  clearCustomerToken();
  state.user = null;
  updateAccountMenu();
  renderProfile();
  showToast('Logged out');
}

// Ends the admin session. showMessage=false is used when the session has expired.
function logoutAdmin(showMessage = true) {
  clearAdminSession();
  updateAccountMenu();
  if (state.route === 'admin') {
    setRoute(showMessage ? 'home' : 'auth');
  } else {
    // Re-draw the current page so admin-only tools disappear
    setRoute(state.route || 'home');
  }
  showToast(showMessage ? 'Admin signed out' : 'Your admin session expired. Please sign in again.');
}

// Show whether the admin is signed in on every page, with Dashboard and Logout
function updateAdminBar() {
  const bar = document.getElementById('admin-bar');
  if (!bar) return;
  const signedIn = Boolean(getAdminToken());
  bar.hidden = !signedIn;
  document.body.classList.toggle('has-admin-bar', signedIn);
  const email = bar.querySelector('.admin-bar-email');
  if (email) email.textContent = getAdminEmail();
}

// On start-up, confirm a saved admin sign-in is still accepted by the server
async function verifyAdminSession() {
  const token = getAdminToken();
  if (!token) return;
  try {
    const response = await fetch(`${API_BASE}/api/admin/session`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 401 || response.status === 403) {
      logoutAdmin(false);
    }
  } catch (error) {
    // Offline or server busy: keep the saved session
  }
}

function updateCartBadge() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const bottomBadge = document.getElementById('bottom-cart-badge');
  if (bottomBadge) bottomBadge.textContent = count;
  const headerBadge = document.getElementById('header-cart-badge');
  if (headerBadge) {
    headerBadge.textContent = count;
    headerBadge.classList.toggle('is-empty', count === 0);
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
