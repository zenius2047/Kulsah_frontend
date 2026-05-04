import React, { useMemo, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fontScale } from './fonts';
import { useThemeMode } from './theme';
import { mediumScreen } from './types';

interface Product {
  id: string;
  name: string;
  artist: string;
  price: number;
  priceString: string;
  img: string;
  category: string;
  description: string;
}

interface CheckoutItem extends Product {
  quantity: number;
}

const MOCK_PRODUCTS: Product[] = [
  { id: 'm1', name: '5,000 Kulcoins', artist: 'Official', price: 50, priceString: '50 GHS', img: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=400', category: 'Currency', description: 'Universal currency for the Kulsah ecosystem. Use these to purchase gifts for creators during live transmissions.' },
  { id: 'm2', name: 'Golden Microphone', artist: 'Official', price: 25, priceString: '2500 KC', img: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=400', category: 'Gifts', description: 'A premium virtual gift to show your appreciation. Increases creator visibility.' },
  { id: 'm3', name: 'Diamond Heart', artist: 'Official', price: 50, priceString: '5000 KC', img: 'https://images.unsplash.com/photo-1518196775791-2e1bbd3a3180?auto=format&fit=crop&q=80&w=400', category: 'Gifts', description: 'The ultimate symbol of fan devotion. Notifies everyone in the stream.' },
  { id: 'm4', name: 'Rocket Boost', artist: 'Official', price: 15, priceString: '1500 KC', img: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=400', category: 'Powerups', description: 'Launch a creator into the global orbit with this massive engagement surge.' },
  { id: 'm5', name: 'Legendary Crown', artist: 'Official', price: 100, priceString: '10,000 KC', img: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&q=80&w=400', category: 'Badges', description: 'Limited edition badge of honor for the most dedicated supporters.' },
  { id: 'm6', name: 'VIP Pass', artist: 'Official', price: 200, priceString: '20,000 KC', img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800', category: 'Passes', description: 'Unlock premium emojis and priority chat for 30 days.' },
];

type CheckoutStep = 'details' | 'payment' | 'success';
type PaymentMethod = 'wallet' | 'card' | 'momo';
type MomoProvider = 'mtn' | 'airtel' | 'telecel';

const categories = ['All', 'Currency', 'Gifts', 'Badges', 'Powerups', 'Passes'];

const MarketPlace: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const gridGap = isTablet ? 14 : 12;
  const gridItemWidth = (width - 32 - gridGap) / 2;

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('details');
  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [momoProvider, setMomoProvider] = useState<MomoProvider>('mtn');

  const filteredProducts = useMemo(
    () =>
      MOCK_PRODUCTS.filter((product) => {
        const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          query.length === 0 ||
          product.name.toLowerCase().includes(query) ||
          product.artist.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      }),
    [activeCategory, searchQuery],
  );

  const checkoutTotal = checkoutItem ? checkoutItem.price * checkoutItem.quantity : 0;

  const openCheckout = (product: Product, quantity: number) => {
    setCheckoutItem({ ...product, quantity });
    setViewingProduct(null);
    setProductQuantity(1);
  };

  const updateCheckoutQuantity = (delta: number) => {
    setCheckoutItem((prev) =>
      prev ? { ...prev, quantity: Math.max(1, prev.quantity + delta) } : prev,
    );
  };

  const handleBuyNow = (product: Product) => {
    setCheckoutItem({ ...product, quantity: 1 });
    setCheckoutStep('details');
    setIsProcessing(false);
  };

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setCheckoutStep('success');
    }, 2000);
  };

  const closeCheckout = () => {
    setCheckoutItem(null);
    setCheckoutStep('details');
    setIsProcessing(false);
    if (checkoutStep === 'success') {
      setPhoneNumber('');
      setPaymentMethod('wallet');
      setMomoProvider('mtn');
    }
  };

  const renderQuantityControl = (
    quantity: number,
    onMinus: () => void,
    onPlus: () => void,
    compact?: boolean,
  ) => (
    <View
      style={[
        s.quantityWrap,
        {
          backgroundColor: isDark ? '#0f172a' : theme.card,
          borderColor: theme.border,
          padding: compact ? 4 : 6,
        },
      ]}
    >
      <Pressable
        onPress={onMinus}
        style={[s.quantityBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface }]}
      >
        <MaterialIcons name="remove" size={compact ? 16 : 18} color={theme.text} />
      </Pressable>
      <Text style={[s.quantityValue, { color: theme.text, width: compact ? 22 : 34 }]}>{quantity}</Text>
      <Pressable
        onPress={onPlus}
        style={[s.quantityBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface }]}
      >
        <MaterialIcons name="add" size={compact ? 16 : 18} color={theme.text} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: theme.screen }]}>
      <View style={[s.headerShell, { backgroundColor: isDark ? 'rgba(6,9,19,0.94)' : 'rgba(255,255,255,0.94)', borderBottomColor: theme.border }]}>
        <View style={s.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[s.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : theme.surface, borderColor: theme.border }]}
          >
            <MaterialIcons name="arrow-back" size={20} color={theme.text} />
          </Pressable>

          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: theme.text }]}>Kulsah Asset Vault</Text>
            <View style={s.headerSubRow}>
              <View style={s.liveDot} />
              <Text style={s.headerSubText}>Secure Digital Marketplace</Text>
            </View>
          </View>

          <View style={{ width: 42, height: 42 }} />
        </View>

        <View style={[s.searchWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderColor: theme.border }]}>
          <MaterialIcons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Artifacts & Assets..."
            placeholderTextColor={theme.textMuted}
            style={[s.searchInput, { color: theme.text }]}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.categoriesRow}
        >
          {categories.map((category) => {
            const active = activeCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setActiveCategory(category)}
                style={[
                  s.categoryChip,
                  active
                    ? s.categoryChipActive
                    : {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface,
                        borderColor: theme.border,
                      },
                ]}
              >
                <Text style={[s.categoryText, { color: active ? '#fff' : theme.textSecondary }]}>
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.grid}>
          {filteredProducts.map((product, index) => (
            <Pressable
              key={product.id}
              onPress={() => {
                setViewingProduct(product);
                setProductQuantity(1);
              }}
              style={[
                s.productCardWrap,
                {
                  width: gridItemWidth,
                  marginRight: index % 2 === 0 ? gridGap : 0,
                },
              ]}
            >
              <View
                style={[
                  s.productVisual,
                  {
                    backgroundColor: isDark ? '#111827' : '#e2e8f0',
                    borderColor: product.category === 'Passes' ? 'rgba(205,43,238,0.32)' : theme.border,
                  },
                ]}
              >
                <Image source={{ uri: product.img }} style={s.productImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.82)']} style={StyleSheet.absoluteFillObject} />
                <View style={s.productFooter}>
                  <Text style={s.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={s.productPrice}>{product.priceString}</Text>
                </View>
              </View>

              <Pressable
                onPress={() => handleBuyNow(product)}
                style={[
                  s.buyButton,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[s.buyButtonText, { color: theme.textSecondary }]}>Buy</Text>
              </Pressable>
            </Pressable>
          ))}

          {filteredProducts.length === 0 ? (
            <View style={s.emptyState}>
              <View style={[s.emptyIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderColor: theme.border }]}>
                <MaterialIcons name="shopping-bag" size={44} color={theme.textMuted} />
              </View>
              <Text style={[s.emptyTitle, { color: theme.textSecondary }]}>No items found in this orbit</Text>
              <Pressable
                onPress={() => {
                  setActiveCategory('All');
                  setSearchQuery('');
                }}
                style={s.resetButton}
              >
                <Text style={s.resetButtonText}>Reset Filters</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal 
      statusBarTranslucent
      visible={!!viewingProduct} animationType="slide" transparent onRequestClose={() => setViewingProduct(null)}>
        <View style={s.modalOverlay}>
          <Pressable style={s.modalBackdrop} onPress={() => setViewingProduct(null)} />
          {viewingProduct ? (
            <View style={[s.modalSheet, { backgroundColor: theme.card }]}>
              <View style={s.grabber} />
              <View style={s.modalHeader}>
                <View>
                  <Text style={[s.sheetTitle, { color: theme.text }]}>Artifact Detail</Text>
                  <Text style={[s.sheetCaption, { color: theme.textSecondary }]}>Authenticated Digital Asset</Text>
                </View>
                <Pressable
                  onPress={() => setViewingProduct(null)}
                  style={[s.sheetIconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surface }]}
                >
                  <MaterialIcons name="close" size={20} color={theme.text} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[s.detailHero, { backgroundColor: isDark ? '#0f172a' : '#e2e8f0', borderColor: theme.border }]}>
                  <Image source={{ uri: viewingProduct.img }} style={s.detailImage} />
                  <LinearGradient colors={['transparent', 'rgba(2,6,23,0.76)']} style={StyleSheet.absoluteFillObject} />
                  <View style={s.detailPriceTag}>
                    <Text style={s.detailPriceTagText}>{viewingProduct.priceString}</Text>
                  </View>
                </View>

                <View style={s.detailBlock}>
                  <View style={s.detailTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.detailCategory}>{viewingProduct.category}</Text>
                      <Text style={[s.detailName, { color: theme.text }]}>{viewingProduct.name}</Text>
                    </View>
                    <View style={s.issuerWrap}>
                      <Text style={[s.issuerLabel, { color: theme.textMuted }]}>Issuer</Text>
                      <Text style={[s.issuerValue, { color: theme.text }]}>{viewingProduct.artist}</Text>
                    </View>
                  </View>

                  <View style={[s.descriptionCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.surface, borderColor: theme.border }]}>
                    <Text style={[s.descriptionText, { color: theme.textSecondary }]}>{viewingProduct.description}</Text>
                  </View>

                  <View style={[s.inventoryRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.surface, borderColor: theme.border }]}>
                    <View>
                      <Text style={[s.inventoryLabel, { color: theme.textMuted }]}>Inventory Units</Text>
                    </View>
                    {renderQuantityControl(
                      productQuantity,
                      () => setProductQuantity((cur) => Math.max(1, cur - 1)),
                      () => setProductQuantity((cur) => cur + 1),
                    )}
                  </View>

                  <View style={s.detailActions}>
                    <Pressable
                      onPress={() => openCheckout(viewingProduct, productQuantity)}
                      style={s.primaryCta}
                    >
                      <Text style={s.primaryCtaText}>Acquire Asset</Text>
                      <MaterialIcons name="bolt" size={18} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal visible={!!checkoutItem} animationType="slide" transparent onRequestClose={closeCheckout}>
        <View style={s.modalOverlay}>
          <Pressable style={s.modalBackdrop} onPress={closeCheckout} />
          <View style={[s.modalSheet, { backgroundColor: theme.card }]}>
            <View style={s.grabber} />

            {checkoutStep === 'details' ? (
              <View style={s.checkoutStepWrap}>
                <View style={s.modalHeader}>
                  <Text style={[s.sheetTitle, { color: theme.text }]}>Review Order</Text>
                  <Pressable
                    onPress={closeCheckout}
                    style={[s.sheetIconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surface }]}
                  >
                    <MaterialIcons name="close" size={20} color={theme.text} />
                  </Pressable>
                </View>

                <ScrollView style={s.reviewList}>
                  {checkoutItem ? (
                    <View style={[s.reviewCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.surface, borderColor: theme.border }]}>
                      <Image source={{ uri: checkoutItem.img }} style={s.reviewThumb} />
                      <View style={s.reviewInfo}>
                        <View style={s.reviewTopRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={[s.reviewName, { color: theme.text }]} numberOfLines={1}>
                              {checkoutItem.name}
                            </Text>
                            <Text style={[s.reviewArtist, { color: theme.textMuted }]}>{checkoutItem.artist}</Text>
                          </View>
                          <Text style={s.reviewAmount}>${(checkoutItem.price * checkoutItem.quantity).toFixed(2)}</Text>
                        </View>

                        <View style={s.reviewBottomRow}>
                          {renderQuantityControl(
                            checkoutItem.quantity,
                            () => updateCheckoutQuantity(-1),
                            () => updateCheckoutQuantity(1),
                            true,
                          )}
                          <Pressable onPress={closeCheckout}>
                            <Text style={s.removeText}>Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ) : null}
                </ScrollView>

                <View style={s.totalBlock}>
                  <View style={s.totalRow}>
                    <Text style={[s.totalLabel, { color: theme.textMuted }]}>Subtotal</Text>
                    <Text style={[s.totalValue, { color: theme.text }]}>${checkoutTotal.toFixed(2)}</Text>
                  </View>
                  <View style={[s.divider, { backgroundColor: theme.border }]} />
                  <View style={s.totalRow}>
                    <Text style={[s.totalMainLabel, { color: theme.text }]}>Total</Text>
                    <Text style={s.totalMainValue}>${checkoutTotal.toFixed(2)}</Text>
                  </View>
                </View>

                <Pressable onPress={() => setCheckoutStep('payment')} style={s.confirmButton}>
                  <Text style={s.confirmButtonText}>Proceed to Payment</Text>
                </Pressable>
              </View>
            ) : null}

            {checkoutStep === 'payment' ? (
              <ScrollView style={s.checkoutStepWrap} showsVerticalScrollIndicator={false}>
                <View style={s.modalHeader}>
                  <Text style={[s.sheetTitle, { color: theme.text }]}>Payment</Text>
                  <Pressable
                    onPress={() => setCheckoutStep('details')}
                    style={[s.sheetIconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.surface }]}
                  >
                    <MaterialIcons name="arrow-back" size={20} color={theme.text} />
                  </Pressable>
                </View>

                <View style={s.paymentOptions}>
                  <Pressable
                    onPress={() => setPaymentMethod('wallet')}
                    style={[
                      s.paymentCard,
                      {
                        backgroundColor: paymentMethod === 'wallet' ? theme.accentSoft : isDark ? 'rgba(255,255,255,0.04)' : theme.surface,
                        borderColor: paymentMethod === 'wallet' ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <View style={s.paymentRow}>
                      <View style={s.paymentLeft}>
                        <MaterialIcons name="account-balance-wallet" size={22} color={paymentMethod === 'wallet' ? theme.accent : theme.textSecondary} />
                        <View>
                          <Text style={[s.paymentTitle, { color: paymentMethod === 'wallet' ? theme.accent : theme.textSecondary }]}>Kulsah Wallet</Text>
                          <Text style={[s.paymentMeta, { color: theme.text }]}>Balance: $420.69</Text>
                        </View>
                      </View>
                      {paymentMethod === 'wallet' ? <MaterialIcons name="check-circle" size={20} color={theme.accent} /> : null}
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setPaymentMethod('momo')}
                    style={[
                      s.paymentCard,
                      {
                        backgroundColor: paymentMethod === 'momo' ? theme.accentSoft : isDark ? 'rgba(255,255,255,0.04)' : theme.surface,
                        borderColor: paymentMethod === 'momo' ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <View style={s.paymentRow}>
                      <View style={s.paymentLeft}>
                        <MaterialIcons name="phone-iphone" size={22} color={paymentMethod === 'momo' ? theme.accent : theme.textSecondary} />
                        <View>
                          <Text style={[s.paymentTitle, { color: paymentMethod === 'momo' ? theme.accent : theme.textSecondary }]}>MoMo Pay</Text>
                          <Text style={[s.paymentMeta, { color: theme.text }]}>Mobile Money Transfer</Text>
                        </View>
                      </View>
                      {paymentMethod === 'momo' ? <MaterialIcons name="check-circle" size={20} color={theme.accent} /> : null}
                    </View>

                    {paymentMethod === 'momo' ? (
                      <View style={s.momoExtras}>
                        <View style={s.providerRow}>
                          {[
                            { id: 'mtn', label: 'MTN', color: '#FFCC00' },
                            { id: 'airtel', label: 'AirtelTigo', color: '#ED1C24' },
                            { id: 'telecel', label: 'Telecel', color: '#E60000' },
                          ].map((provider) => {
                            const active = momoProvider === provider.id;
                            return (
                              <Pressable
                                key={provider.id}
                                onPress={() => setMomoProvider(provider.id as MomoProvider)}
                                style={[
                                  s.providerCard,
                                  {
                                    borderColor: active ? theme.accent : 'transparent',
                                    backgroundColor: active ? (isDark ? 'rgba(255,255,255,0.08)' : theme.card) : isDark ? 'rgba(255,255,255,0.03)' : theme.surface,
                                  },
                                ]}
                              >
                                <View style={[s.providerBadge, { backgroundColor: provider.color }]}>
                                  <Text style={s.providerBadgeText}>{provider.label[0]}</Text>
                                </View>
                                <Text style={[s.providerText, { color: theme.text }]}>{provider.label}</Text>
                              </Pressable>
                            );
                          })}
                        </View>

                        <Text style={[s.inputLabel, { color: theme.textMuted }]}>MoMo Number</Text>
                        <View style={[s.inputWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.card, borderColor: theme.border }]}>
                          <TextInput
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            placeholder="024XXXXXXX"
                            keyboardType="phone-pad"
                            placeholderTextColor={theme.textMuted}
                            style={[s.input, { color: theme.text }]}
                          />
                          <View style={s.verifiedRow}>
                            <View style={s.verifiedDot} />
                            <Text style={s.verifiedText}>Verified</Text>
                          </View>
                        </View>
                      </View>
                    ) : null}
                  </Pressable>

                  <Pressable
                    onPress={() => setPaymentMethod('card')}
                    style={[
                      s.paymentCard,
                      {
                        backgroundColor: paymentMethod === 'card' ? theme.accentSoft : isDark ? 'rgba(255,255,255,0.04)' : theme.surface,
                        borderColor: paymentMethod === 'card' ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <View style={s.paymentRow}>
                      <View style={s.paymentLeft}>
                        <MaterialIcons name="credit-card" size={22} color={paymentMethod === 'card' ? theme.accent : theme.textSecondary} />
                        <View>
                          <Text style={[s.paymentTitle, { color: paymentMethod === 'card' ? theme.accent : theme.textSecondary }]}>Credit Card</Text>
                          <Text style={[s.paymentMeta, { color: theme.text }]}>•••• 4242</Text>
                        </View>
                      </View>
                      {paymentMethod === 'card' ? <MaterialIcons name="check-circle" size={20} color={theme.accent} /> : null}
                    </View>
                  </Pressable>
                </View>

                <Pressable onPress={handlePayment} disabled={isProcessing} style={[s.confirmButton, isProcessing && s.confirmButtonDisabled]}>
                  {isProcessing ? (
                    <View style={s.processingRow}>
                      <ActivityIndicator color="#fff" />
                      <Text style={s.confirmButtonText}>Processing...</Text>
                    </View>
                  ) : (
                    <Text style={s.confirmButtonText}>Pay ${checkoutTotal.toFixed(2)}</Text>
                  )}
                </Pressable>
              </ScrollView>
            ) : null}

            {checkoutStep === 'success' ? (
              <View style={s.successWrap}>
                <View style={s.successIcon}>
                  <MaterialIcons name="check-circle" size={56} color="#fff" />
                </View>
                <Text style={[s.successTitle, { color: theme.text }]}>Order Confirmed!</Text>
                <Text style={[s.successCopy, { color: theme.textSecondary }]}>
                  Your digital items have been added to your inventory. Thank you for supporting the Kulsah community!
                </Text>
                <View style={[s.orderCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : theme.surface, borderColor: theme.border }]}>
                  <Text style={[s.orderLabel, { color: theme.textMuted }]}>Order ID</Text>
                  <Text style={[s.orderValue, { color: theme.text }]}>#KLS-{Math.floor(Math.random() * 1000000)}</Text>
                </View>
                <Pressable onPress={closeCheckout} style={[s.backOrbitButton, { backgroundColor: isDark ? '#fff' : '#0f172a' }]}>
                  <Text style={[s.backOrbitButtonText, { color: isDark ? '#0f172a' : '#fff' }]}>Back to Orbit</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerShell: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: mediumScreen ? fontScale(18) : fontScale(14),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#cd2bee',
  },
  headerSubText: {
    color: '#cd2bee',
    fontSize: mediumScreen ? fontScale(10):fontScale(6),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  searchWrap: {
    marginTop: 16,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: mediumScreen ? fontScale(14): fontScale(10),
    fontFamily: 'PlusJakartaSansBold',
  },
  categoriesRow: {
    paddingTop: 14,
    paddingRight: 10,
    gap: 8,
  },
  categoryChip: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#cd2bee',
    borderColor: '#cd2bee',
  },
  categoryText: {
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productCardWrap: {
    marginBottom: 16,
  },
  productVisual: {
    aspectRatio: 4 / 5,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productFooter: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
  },
  productName: {
    color: '#fff',
    fontSize: mediumScreen ? fontScale(13):fontScale(9),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  productPrice: {
    marginTop: 3,
    color: '#cd2bee',
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  buyButton: {
    marginTop: 10,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: fontScale(12),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(205,43,238,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#cd2bee',
    fontSize: fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2,6,23,0.45)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  grabber: {
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.4)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  sheetTitle: {
    fontSize: mediumScreen ? fontScale(18):fontScale(14),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  sheetCaption: {
    marginTop: 4,
    fontSize: fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  sheetIconButton: {
    width: 42,
    height: 42,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHero: {
    aspectRatio: 4 / 5,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailPriceTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: 'rgba(205,43,238,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.35)',
  },
  detailPriceTagText: {
    color: '#cd2bee',
    fontSize: fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  detailBlock: {
    paddingTop: 20,
    gap: 18,
  },
  detailTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailCategory: {
    color: '#cd2bee',
    fontSize: mediumScreen ? fontScale(14) : fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  detailName: {
    marginTop: 4,
    fontSize: mediumScreen ? fontScale(20):fontScale(16),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  issuerWrap: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  issuerLabel: {
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  issuerValue: {
    marginTop: 4,
    fontSize: mediumScreen ? fontScale(16): fontScale(12),
    fontFamily: 'PlusJakartaSansBold',
  },
  descriptionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  descriptionText: {
    fontSize: mediumScreen ? fontScale(16): fontScale(12),
    fontFamily: 'PlusJakartaSansMedium',
    lineHeight: 17,
  },
  inventoryRow: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  inventoryLabel: {
    fontSize: mediumScreen ? fontScale(14):fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  quantityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
  },
  quantityBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    textAlign: 'center',
    fontSize: mediumScreen ? fontScale(16): fontScale(12),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryCta: {
    flex: 1.35,
    minHeight: 58,
    borderRadius: 999,
    backgroundColor: '#cd2bee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCtaText: {
    color: '#fff',
    fontSize: mediumScreen ? fontScale(14): fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  confirmButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#cd2bee',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15
  },
  confirmButtonDisabled: {
    opacity: 0.75,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize:mediumScreen ? fontScale(14):fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  checkoutStepWrap: {
    maxHeight: '100%',
  },
  reviewList: {
    maxHeight: 260,
  },
  reviewCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  reviewThumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  reviewInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  reviewTopRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewBottomRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewName: {
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  reviewArtist: {
    marginTop: 4,
    fontSize: mediumScreen ? fontScale(10): fontScale(6),
    fontFamily: 'PlusJakartaSansBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  reviewAmount: {
    color: '#cd2bee',
    fontSize: mediumScreen ? fontScale(14):fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  removeText: {
    color: '#ef4444',
    fontSize: fontScale(9),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  totalBlock: {
    paddingTop: 8,
    gap: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: mediumScreen ? fontScale(12):fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  totalValue: {
    fontSize: mediumScreen ? fontScale(14):fontScale(10),
    fontFamily: 'PlusJakartaSansBold',
  },
  totalMainLabel: {
    fontSize: mediumScreen ? fontScale(16):fontScale(12),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  totalMainValue: {
    color: '#cd2bee',
    fontSize: mediumScreen ? fontScale(18):fontScale(14),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  divider: {
    height: 1,
  },
  paymentOptions: {
    gap: 12,
    marginBottom: 18,
  },
  paymentCard: {
    borderWidth: 2,
    borderRadius: 22,
    padding: 14,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentTitle: {
    fontSize: fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  paymentMeta: {
    marginTop: 4,
    fontSize: fontScale(12),
    fontFamily: 'PlusJakartaSansBold',
  },
  momoExtras: {
    marginTop: 16,
    gap: 12,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  providerCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
  },
  providerBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerBadgeText: {
    color: '#fff',
    fontSize: fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  providerText: {
    fontSize: fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: fontScale(9),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: fontScale(12),
    fontFamily: 'PlusJakartaSansBold',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  verifiedText: {
    color: '#22c55e',
    fontSize: fontScale(8),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  successWrap: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    marginTop: 24,
    fontSize: fontScale(28),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  successCopy: {
    marginTop: 10,
    fontSize: fontScale(12),
    fontFamily: 'PlusJakartaSansMedium',
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 280,
  },
  orderCard: {
    width: '100%',
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: fontScale(10),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  orderValue: {
    marginTop: 8,
    fontSize: fontScale(14),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
  },
  backOrbitButton: {
    marginTop: 20,
    width: '100%',
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backOrbitButtonText: {
    fontSize: fontScale(12),
    fontFamily: 'PlusJakartaSansExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
});

export default MarketPlace;
