import React from 'react';
import BuyerStorefront from '../components/buyer/BuyerStorefront';

export default function StorefrontPage({ openAiChat, policy, onAddToCart }) {
  return (
    <div className="w-full">
      <BuyerStorefront openAiChat={openAiChat} policy={policy} onAddToCart={onAddToCart} />
    </div>
  );
}
