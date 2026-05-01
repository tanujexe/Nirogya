import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Beaker, Home, Clock, CheckCircle, ShoppingCart, Star } from 'lucide-react';
import { labTestsAPI } from '../utils/api';
import { toast } from 'react-toastify';

export default function LabTests() {
  const [labTests, setLabTests] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Tests');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await labTestsAPI.getAll();
        setLabTests(res.data.data);
      } catch (error) {
        console.error("Error fetching lab tests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const addToCart = (testId, testName) => {
    if (cart.includes(testId)) {
      toast.info('Test already in cart');
      return;
    }
    setCart([...cart, testId]);
    toast.success(`${testName} added to cart`);
  };

  const categories = [
    'All Tests',
    'Blood Test',
    'Hormone Test',
    'Vitamin Test',
    'Health Package'
  ];

  const filteredTests = labTests.filter(
    (test) => selectedCategory === 'All Tests' || test.category === selectedCategory
  );

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Book{' '}
            <span className="bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] bg-clip-text text-transparent">
              Lab Tests
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Get accurate diagnostic tests from certified labs
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] rounded-2xl p-6 text-white">
            <Home className="w-10 h-10 mb-3" />
            <h3 className="font-semibold mb-2">Home Sample Collection</h3>
            <p className="text-sm opacity-90">Free collection from your doorstep</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="w-10 h-10 bg-[var(--healthcare-green)]/10 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-[var(--healthcare-green)]" />
            </div>
            <h3 className="font-semibold mb-2">NABL Certified Labs</h3>
            <p className="text-sm text-muted-foreground">100% accurate results</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="w-10 h-10 bg-[var(--healthcare-blue)]/10 rounded-xl flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-[var(--healthcare-blue)]" />
            </div>
            <h3 className="font-semibold mb-2">Fast Reports</h3>
            <p className="text-sm text-muted-foreground">Get results within 24-48 hours</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="w-10 h-10 bg-[var(--healthcare-cyan)]/10 rounded-xl flex items-center justify-center mb-3">
              <Star className="w-6 h-6 text-[var(--healthcare-cyan)]" />
            </div>
            <h3 className="font-semibold mb-2">Best Prices</h3>
            <p className="text-sm text-muted-foreground">Affordable diagnostic services</p>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white shadow-lg'
                  : 'bg-card border border-border hover:bg-accent'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {selectedCategory === 'All Tests' ? 'All Lab Tests' : selectedCategory}
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredTests.length} tests available
              </span>
            </div>

            <div className="grid gap-6">
              {filteredTests.map((test, index) => (
                <motion.div
                  key={test._id || test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-2xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-gradient-to-br from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] rounded-xl">
                        <Beaker className="w-6 h-6 text-white" />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-1">{test.testName || test.name}</h3>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-3 py-1 bg-[var(--healthcare-blue)]/10 text-[var(--healthcare-blue)] rounded-full text-xs">
                            {test.category}
                          </span>

                          {test.popular && (
                            <span className="px-3 py-1 bg-[var(--healthcare-green)]/10 text-[var(--healthcare-green)] rounded-full text-xs flex items-center space-x-1">
                              <Star className="w-3 h-3" fill="currentColor" />
                              <span>Popular</span>
                            </span>
                          )}

                          {test.fasting && (
                            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-xs">
                              Fasting Required
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Report in {test.duration}</span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Home className="w-4 h-4" />
                            <span>Home collection available</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Test Price</p>
                      <p className="text-2xl font-bold text-[var(--healthcare-cyan)]">
                        ₹{test.price}
                      </p>
                    </div>

                    <button
                      onClick={() => addToCart(test._id || test.id, test.testName || test.name)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all ${
                        cart.includes(test._id || test.id)
                          ? 'bg-[var(--healthcare-green)]/10 text-[var(--healthcare-green)] border-2 border-[var(--healthcare-green)]'
                          : 'bg-gradient-to-r from-[var(--healthcare-cyan)] to-[var(--healthcare-blue)] text-white'
                      }`}
                    >
                      {cart.includes(test._id || test.id) ? 'Added to Cart' : 'Add to Cart'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
            <h3 className="text-lg font-semibold mb-4">Your Cart</h3>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              cart.map((id) => {
                const test = labTests.find((t) => t._id === id || t.id === id);
                return (
                  <div key={id} className="flex justify-between mb-3">
                    <span className="text-sm">{test?.name}</span>
                    <span className="text-sm">₹{test?.price}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}