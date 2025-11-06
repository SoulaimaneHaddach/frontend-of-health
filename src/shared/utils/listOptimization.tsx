// src/shared/utils/listOptimization.tsx
/**
 * FlatList optimization utilities
 * Best practices for high-performance lists
 */

import React from 'react';
import { View, Text } from 'react-native';

/**
 * Default FlatList optimization props
 * Apply these to all FlatLists for better performance
 */
export const OPTIMIZED_LIST_CONFIG = {
  // Remove views outside viewport
  removeClippedSubviews: true,
  
  // Render items in batches
  maxToRenderPerBatch: 10,
  
  // Update cells in batches
  updateCellsBatchingPeriod: 50,
  
  // Initial number of items to render
  initialNumToRender: 10,
  
  // Window size (viewport multiples)
  windowSize: 5,
} as const;

/**
 * Generate key extractor for FlatList
 * Ensures stable keys for optimal rendering
 */
export const createKeyExtractor = <T extends { id: string | number }>(
  prefix?: string
) => {
  return (item: T, index: number): string => {
    const key = item.id?.toString() || index.toString();
    return prefix ? `${prefix}-${key}` : key;
  };
};

/**
 * Get item layout for FlatList
 * Enables scroll-to-index and improves performance
 * 
 * @param itemHeight Fixed height of each item
 * @param separator Height of separator (if any)
 */
export const createGetItemLayout = (itemHeight: number, separator: number = 0) => {
  return (_data: any, index: number) => ({
    length: itemHeight,
    offset: (itemHeight + separator) * index,
    index,
  });
};

/**
 * Empty list component with message
 */
export const createEmptyListComponent = (message: string = 'No items found') => {
  const EmptyComponent = () => (
    <View style={{ padding: 24, alignItems: 'center' }}>
      <Text style={{ fontSize: 16, color: '#999', textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
  return EmptyComponent;
};

/**
 * List separator component
 */
export const createListSeparator = (height: number = 16, color?: string) => {
  return () => (
    <View 
      style={{ 
        height, 
        backgroundColor: color || 'transparent' 
      }} 
    />
  );
};

/**
 * Pagination helper for infinite scroll
 */
export interface PaginationState {
  page: number;
  hasMore: boolean;
  loading: boolean;
}

export const createPaginationHelper = (pageSize: number = 20) => {
  return {
    initialState: {
      page: 1,
      hasMore: true,
      loading: false,
    } as PaginationState,
    
    onEndReached: (
      state: PaginationState,
      onLoadMore: (page: number) => Promise<any[]>
    ) => async () => {
      if (state.loading || !state.hasMore) return;
      
      const nextPage = state.page + 1;
      const items = await onLoadMore(nextPage);
      
      return {
        page: nextPage,
        hasMore: items.length === pageSize,
        loading: false,
      };
    },
  };
};

/**
 * Chunked rendering for very large lists
 * Progressively renders items to avoid blocking UI
 */
export const useChunkedRendering = <T,>(
  data: T[],
  chunkSize: number = 20
): T[] => {
  const [displayedItems, setDisplayedItems] = React.useState<T[]>([]);
  const [currentChunk, setCurrentChunk] = React.useState(0);

  React.useEffect(() => {
    if (currentChunk * chunkSize >= data.length) return;

    const timer = setTimeout(() => {
      const nextChunk = currentChunk + 1;
      const itemsToShow = data.slice(0, nextChunk * chunkSize);
      setDisplayedItems(itemsToShow);
      setCurrentChunk(nextChunk);
    }, 16); // ~60fps

    return () => clearTimeout(timer);
  }, [data, currentChunk, chunkSize]);

  React.useEffect(() => {
    // Reset when data changes
    setCurrentChunk(0);
    setDisplayedItems(data.slice(0, chunkSize));
  }, [data, chunkSize]);

  return displayedItems;
};
