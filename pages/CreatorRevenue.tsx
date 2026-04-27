import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useThemeMode } from '../theme';
import { View, Text, Pressable, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { GoogleGenAI } from "@google/genai";

interface Transaction {
  id: string;
  type: 'tip' | 'subscription' | 'ticket' | 'payout';
  amount: string;
  user?: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

type PayoutMethod = 'bank' | 'momo' | 'paypal' | 'crypto';

const CreatorRevenue: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutProgress, setPayoutProgress] = useState(0);
  
  // Payout Form States
  const availableBalance = 12450.00;
  const [withdrawAmount, setWithdrawAmount] = useState<string>(availableBalance.toString());
  const [selectedMethod, setSelectedMethod] = useState<PayoutMethod>('bank');
  const [momoNumber, setMomoNumber] = useState("");

  const transactions: Transaction[] = [
    { id: 'tx1', type: 'tip', amount: '+$50.00', user: 'Alex_Vibes', date: 'Oct 24, 2:45 PM', status: 'completed' },
    { id: 'tx2', type: 'subscription', amount: '+$14.99', user: 'Sarah_Music', date: 'Oct 24, 1:12 PM', status: 'completed' },
    { id: 'tx3', type: 'ticket', amount: '+$350.00', user: 'Echo_Fan', date: 'Oct 23, 11:30 PM', status: 'completed' },
    { id: 'tx4', type: 'payout', amount: '-$5,000.00', date: 'Oct 20, 9:00 AM', status: 'completed' },
    { id: 'tx5', type: 'subscription', amount: '+$49.99', user: 'Mark_Gold', date: 'Oct 19, 4:20 PM', status: 'pending' },
  ];

  const getFinancialAdvice = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze this creator revenue breakdown: $12,450 available for payout. Sources: 60% Subscriptions, 30% Tickets, 10% Tips. Subscriber growth is steady at 5%. Give a 2-sentence financial strategic advice on how to optimize tips during Live sessions for a musician named Mila Ray.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiAdvice(response.text || "Revenue streams are healthy. Focus on increasing tip velocity.");
    } catch (e) {
      setAiAdvice("Your subscription base provides a strong floor. To boost liquid capital, consider low-cost 'tip-triggered' rewards during live streams like custom shoutouts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFinancialAdvice();
  }, []);

  const handlePayoutRequest = () => {
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > availableBalance) {
      alert("Please enter a valid amount within your available balance.");
      return;
    }

    setPayoutProgress(1);
    setTimeout(() => setPayoutProgress(40), 1000);
    setTimeout(() => setPayoutProgress(100), 2500);
    setTimeout(() => {
      setIsPayoutModalOpen(false);
      setPayoutProgress(0);
      setWithdrawAmount(availableBalance.toString());
    }, 3500);
  };

  return (
    <View>
      <View>
        <View>
          <Pressable onPress={() => navigation.goBack()}>
            <Text>chevron_left</Text>
          </Pressable>
          <Text>Revenue Studio</Text>
        </View>
        <Pressable 
         
          onPress={() => navigation.navigate('/wallet')}
        >
          <Text>settings</Text>
        </Pressable>
      </View>

      <View>
        {/* Core Balance Card */}
        <View>
          <View></View>
          <View>
            <View></View>
            
            <View>
              <Text>Available for Payout</Text>
              <View>
                <Text>${availableBalance.toLocaleString()}</Text>
                <Text>PCR</Text>
              </View>
            </View>

            <View>
              <View>
                <Text>Total Earned</Text>
                <Text>$45,820</Text>
              </View>
              <View>
                <Text>Pending</Text>
                <Text>$3,240</Text>
              </View>
            </View>

            <Pressable 
              onPress={() => setIsPayoutModalOpen(true)}
             
            >
              Request Payout
            </Pressable>
          </View>
        </View>

        {/* AI Financial Strategist */}
        <View>
          <View></View>
          <View>
            <View>
              <View>
                <View>
                  <Text>auto_awesome</Text>
                </View>
                <View>
                  <Text>Revenue Strategist</Text>
                  <Text>Powered by Gemini AI</Text>
                </View>
              </View>
              <Pressable 
                onPress={getFinancialAdvice}
                disabled={loading}
               
              >
                <Text>sync</Text>
              </Pressable>
            </View>
            <Text>
              {loading ? "Analyzing monetization velocity and channel conversion..." : (aiAdvice || "No audit available yet.")}
            </Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View>
          <View>
            <Text>Transaction History</Text>
            <Pressable>Filter</Pressable>
          </View>
          <View>
            {transactions.map((tx) => (
              <View key={tx.id}>
                <View>
                  <View>
                    <Text>
                      {tx.type === 'tip' ? 'redeem' : tx.type === 'subscription' ? 'stars' : tx.type === 'ticket' ? 'confirmation_number' : 'outbox'}
                    </Text>
                  </View>
                  <View>
                    <View>
                      <Text>{tx.type === 'payout' ? 'Payout' : tx.user}</Text>
                      <Text>
                        {tx.status}
                      </Text>
                    </View>
                    <Text>{tx.date}</Text>
                  </View>
                </View>
                <Text>
                  {tx.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Payout Request Modal */}
      {isPayoutModalOpen && (
        <View>
          <View onPress={() => setIsPayoutModalOpen(false)}></View>
          <View>
            <View></View>
            
            <View>
              <Text>Withdraw Funds</Text>
              <Text>Select Amount & Gateway</Text>
            </View>

            {/* Amount Input */}
            <View>
              <Text>Withdrawal Amount (USD)</Text>
              <View>
                <Text>$</Text>
                <TextInput 
                  type="number"
                  value={withdrawAmount}
                  onChangeText={(value) => setWithdrawAmount(value)}
                 
                  placeholder="0.00"
                />
              </View>
              <View>
                <Text>Max: ${availableBalance.toLocaleString()}</Text>
                <Pressable 
                  onPress={() => setWithdrawAmount(availableBalance.toString())}
                 
                >
                  Use Max
                </Pressable>
              </View>
            </View>

            {/* Payout Methods Grid */}
            <View>
              <Text>Payment Gateway</Text>
              <View>
                {[
                  { id: 'momo', label: 'Mobile Money', sub: 'Momo / Airtel', icon: 'smartphone', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20' },
                  { id: 'bank', label: 'Bank Transfer', sub: 'Chase ...4292', icon: 'account_balance', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20' },
                  { id: 'paypal', label: 'PayPal', sub: 'Instant Transfer', icon: 'payments', color: 'bg-primary/10 text-primary border-primary/20' },
                  { id: 'crypto', label: 'Crypto Wallet', sub: 'USDT / USDC', icon: 'currency_bitcoin', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
                ].map((method) => (
                  <Pressable 
                    key={method.id}
                    onPress={() => setSelectedMethod(method.id as PayoutMethod)}
                   
                  >
                    <Text>{method.icon}</Text>
                    <Text>{method.label}</Text>
                    <Text>{method.sub}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Momo Specific Input */}
            {selectedMethod === 'momo' && (
              <View>
                <Text>Momo Phone Number</Text>
                <TextInput 
                  type="tel"
                  value={momoNumber}
                  onChangeText={(value) => setMomoNumber(value)}
                 
                  placeholder="+234 812 000 0000"
                />
              </View>
            )}

            {payoutProgress > 0 ? (
              <View>
                <View>
                  <Text>{payoutProgress < 100 ? `Initiating ${selectedMethod.toUpperCase()} Transfer...` : 'Transfer Success!'}</Text>
                  <Text>{payoutProgress}%</Text>
                </View>
                <View>
                  <View style={{ width: `${payoutProgress}%` }}></View>
                </View>
              </View>
            ) : (
              <View>
                <Pressable 
                  onPress={() => setIsPayoutModalOpen(false)}
                 
                >
                  Cancel
                </Pressable>
                <Pressable 
                  onPress={handlePayoutRequest}
                 
                >
                  Withdraw ${parseFloat(withdrawAmount || '0').toLocaleString()}
                </Pressable>
              </View>
            )}
            
            <Text>Funds typically arrive within 1-24 planetary hours.</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default CreatorRevenue;
