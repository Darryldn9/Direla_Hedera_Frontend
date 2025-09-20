import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  X, 
  Filter, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShoppingCart, 
  Users, 
  Zap,
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronDown
} from 'lucide-react-native';

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'purchase' | 'lending' | 'withdrawal' | 'deposit';
  description: string;
  amount: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  category: string;
  recipient?: string;
  reference?: string;
}

interface TransactionHistoryModalProps {
  visible: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'sent' | 'received' | 'purchase' | 'lending';
type SortType = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export default function TransactionHistoryModal({ visible, onClose }: TransactionHistoryModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('date_desc');
  const [showFilters, setShowFilters] = useState(false);

  // Generate mock transaction data
  const generateTransactions = (pageNum: number, pageSize: number = 20): Transaction[] => {
    const types: Transaction['type'][] = ['sent', 'received', 'purchase', 'lending', 'withdrawal', 'deposit'];
    const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other'];
    const descriptions = [
      'Grocery Store Payment', 'Uber Ride', 'Netflix Subscription', 'Electricity Bill',
      'Coffee Shop', 'Online Shopping', 'Restaurant', 'Fuel Payment',
      'Movie Tickets', 'Gym Membership', 'Phone Bill', 'Internet Bill',
      'Medical Consultation', 'Book Purchase', 'Gift to Friend', 'Salary Received'
    ];

    const mockTransactions: Transaction[] = [];
    const startId = (pageNum - 1) * pageSize;

    for (let i = 0; i < pageSize; i++) {
      const id = (startId + i + 1).toString();
      const type = types[Math.floor(Math.random() * types.length)];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const amount = Math.floor(Math.random() * 2000) + 10;
      const daysAgo = Math.floor(Math.random() * 90);
      const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      
      mockTransactions.push({
        id,
        type,
        description,
        amount,
        timestamp,
        status: Math.random() > 0.1 ? 'completed' : Math.random() > 0.5 ? 'pending' : 'failed',
        category: categories[Math.floor(Math.random() * categories.length)],
        recipient: type === 'sent' ? 'John Doe' : undefined,
        reference: `REF${id.padStart(6, '0')}`,
      });
    }

    return mockTransactions;
  };

  const loadTransactions = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTransactions = generateTransactions(pageNum);
      
      if (isRefresh || pageNum === 1) {
        setTransactions(newTransactions);
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
      }
      
      // Simulate end of data after 5 pages
      setHasMore(pageNum < 5);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortType) {
        case 'date_desc':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'date_asc':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, filterType, sortType]);

  useEffect(() => {
    if (visible) {
      loadTransactions(1, true);
      setPage(1);
    }
  }, [visible, loadTransactions]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTransactions(nextPage);
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight size={20} color="#E74C3C" />;
      case 'received':
        return <ArrowDownLeft size={20} color="#27AE60" />;
      case 'purchase':
        return <ShoppingCart size={20} color="#3498DB" />;
      case 'lending':
        return <Users size={20} color="#9B59B6" />;
      case 'withdrawal':
        return <TrendingDown size={20} color="#E67E22" />;
      case 'deposit':
        return <TrendingUp size={20} color="#27AE60" />;
      default:
        return <Zap size={20} color="#95A5A6" />;
    }
  };

  const getAmountColor = (type: Transaction['type']) => {
    switch (type) {
      case 'received':
      case 'deposit':
        return '#27AE60';
      case 'sent':
      case 'purchase':
      case 'withdrawal':
        return '#E74C3C';
      default:
        return '#2C3E50';
    }
  };

  const getAmountPrefix = (type: Transaction['type']) => {
    switch (type) {
      case 'received':
      case 'deposit':
        return '+';
      case 'sent':
      case 'purchase':
      case 'withdrawal':
        return '-';
      default:
        return '';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const TransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        {getTransactionIcon(item.type)}
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionCategory}>{item.category}</Text>
        <Text style={styles.transactionTime}>{formatDate(item.timestamp)}</Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.transactionAmountText,
          { color: getAmountColor(item.type) }
        ]}>
          {getAmountPrefix(item.type)}R{item.amount.toFixed(2)}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'completed' ? '#E8F5E8' : item.status === 'pending' ? '#FFF3CD' : '#F8D7DA' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'completed' ? '#27AE60' : item.status === 'pending' ? '#856404' : '#721C24' }
          ]}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ title, value, isActive }: { title: string, value: FilterType, isActive: boolean }) => (
    <TouchableOpacity
      onPress={() => setFilterType(value)}
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
    >
      <Text style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const SortButton = ({ title, value, isActive }: { title: string, value: SortType, isActive: boolean }) => (
    <TouchableOpacity
      onPress={() => setSortType(value)}
      style={[styles.sortButton, isActive && styles.activeSortButton]}
    >
      <Text style={[styles.sortButtonText, isActive && styles.activeSortButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#2C3E50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <TouchableOpacity 
            onPress={() => setShowFilters(!showFilters)} 
            style={styles.filterToggle}
          >
            <Filter size={20} color="#0C7C59" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#7F8C8D" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersTitle}>Filter by Type</Text>
            <View style={styles.filterButtons}>
              <FilterButton title="All" value="all" isActive={filterType === 'all'} />
              <FilterButton title="Sent" value="sent" isActive={filterType === 'sent'} />
              <FilterButton title="Received" value="received" isActive={filterType === 'received'} />
              <FilterButton title="Purchase" value="purchase" isActive={filterType === 'purchase'} />
              <FilterButton title="Lending" value="lending" isActive={filterType === 'lending'} />
            </View>

            <Text style={styles.filtersTitle}>Sort by</Text>
            <View style={styles.sortButtons}>
              <SortButton title="Date (Newest)" value="date_desc" isActive={sortType === 'date_desc'} />
              <SortButton title="Date (Oldest)" value="date_asc" isActive={sortType === 'date_asc'} />
              <SortButton title="Amount (High)" value="amount_desc" isActive={sortType === 'amount_desc'} />
              <SortButton title="Amount (Low)" value="amount_asc" isActive={sortType === 'amount_asc'} />
            </View>
          </View>
        )}

        {/* Transaction List */}
        <FlatList
          data={filteredTransactions}
          renderItem={TransactionItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0C7C59" />
                <Text style={styles.loadingText}>Loading transactions...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Calendar size={48} color="#BDC3C7" />
                <Text style={styles.emptyText}>No transactions found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
              </View>
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#0C7C59" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
  },
  filterToggle: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2C3E50',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filtersTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 8,
    marginTop: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  activeFilterButton: {
    backgroundColor: '#0C7C59',
    borderColor: '#0C7C59',
  },
  filterButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  activeSortButton: {
    backgroundColor: '#3498DB',
    borderColor: '#3498DB',
  },
  sortButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#7F8C8D',
  },
  activeSortButtonText: {
    color: '#FFFFFF',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#95A5A6',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F8C8D',
  },
});
