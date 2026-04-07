const GameEngine = require('../../utils/gameEngine.js');

Page({
  data: {
    playerCount: 2,
    gameEngine: null,
    currentPlayer: 0,
    players: [],
    currentRoundCards: [],
    myHand: [],
    gameStatus: 'playing', // playing, won, lost
    winner: null,
    message: '庄家开始出牌...',
    selectedCards: [],
    canPlay: false
  },

  onLoad: function(options) {
    const playerCount = parseInt(options.players) || 2;
    this.initGame(playerCount);
  },

  initGame: function(playerCount) {
    const gameEngine = new GameEngine(playerCount);
    gameEngine.initGame();

    this.setData({
      playerCount: playerCount,
      gameEngine: gameEngine,
      players: gameEngine.players.map(p => ({
        id: p.id,
        handCount: p.hand.length,
        isDealer: p.isDealer,
        hasReported: p.hasReported
      })),
      myHand: gameEngine.players[0].hand,
      currentPlayer: gameEngine.dealer,
      canPlay: gameEngine.dealer === 0,
      message: gameEngine.dealer === 0 ? '你是庄家，请出牌' : '等待庄家出牌...'
    });
  },

  selectCard: function(e) {
    const index = e.currentTarget.dataset.index;
    const selectedCards = this.data.selectedCards;
    
    if (selectedCards.includes(index)) {
      selectedCards.splice(selectedCards.indexOf(index), 1);
    } else {
      selectedCards.push(index);
    }

    this.setData({ selectedCards: selectedCards });
  },

  playCards: function() {
    if (!this.data.canPlay) {
      wx.showToast({ title: '还未轮到你', icon: 'none' });
      return;
    }

    if (this.data.selectedCards.length === 0) {
      wx.showToast({ title: '请选择要出的牌', icon: 'none' });
      return;
    }

    const selectedIndices = this.data.selectedCards;
    const cardsToPlay = selectedIndices.map(i => this.data.myHand[i]);
    
    // 验证牌型
    const gameEngine = this.data.gameEngine;
    const cardType = gameEngine.getCardType(cardsToPlay);
    
    if (!cardType) {
      wx.showToast({ title: '牌型不符合规则', icon: 'none' });
      return;
    }

    // 移除已出的牌
    const remainingCards = this.data.myHand.filter((_, i) => !selectedIndices.includes(i));
    
    // 检查是否只剩1张牌
    if (remainingCards.length === 1) {
      wx.showToast({ title: '报单！您还剩1张牌', icon: 'success' });
    }

    this.setData({
      myHand: remainingCards,
      currentRoundCards: cardsToPlay,
      selectedCards: [],
      canPlay: false,
      message: '对手处理中...'
    });

    // 模拟下一个玩家回应
    setTimeout(() => this.nextPlayer(), 1000);
  },

  passRound: function() {
    if (!this.data.canPlay) {
      wx.showToast({ title: '还未轮到你', icon: 'none' });
      return;
    }

    this.setData({
      canPlay: false,
      message: '你已过牌，轮到下一个玩家...'
    });

    setTimeout(() => this.nextPlayer(), 1000);
  },

  nextPlayer: function() {
    let nextPlayerId = (this.data.currentPlayer + 1) % this.data.playerCount;
    
    if (nextPlayerId === 0) {
      // 游戏结束检查
      if (this.data.myHand.length === 0) {
        this.endGame(true);
        return;
      }
    }

    this.setData({
      currentPlayer: nextPlayerId,
      canPlay: nextPlayerId === 0,
      message: nextPlayerId === 0 ? '轮到你了，请决定是接牌还是过牌' : `轮到玩家 ${nextPlayerId} ...`
    });
  },

  endGame: function(won) {
    this.setData({
      gameStatus: won ? 'won' : 'lost',
      winner: won ? '你' : '其他玩家',
      canPlay: false,
      message: won ? '🎉 恭喜你赢了！' : '💔 很遗憾，你输了'
    });
  },

  restartGame: function() {
    this.initGame(this.data.playerCount);
  },

  backToHome: function() {
    wx.navigateBack();
  }
});