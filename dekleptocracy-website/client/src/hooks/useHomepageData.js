import { useState, useEffect, useCallback } from 'react';
import * as homepageApi from '../api/homepage';

/**
 * Hook for fetching and managing homepage data
 * @param {Object} options - Configuration options
 * @param {string} options.state - State name or 'nationwide'
 * @param {string} options.timePeriod - Time period: 'YoY', '3 months', '30 days'
 * @param {boolean} options.autoFetch - Whether to fetch on mount (default: true)
 */
export function useHomepageData(options = {}) {
  const { state = 'nationwide', timePeriod = 'YoY', autoFetch = true } = options;

  const [data, setData] = useState({
    walletShocks: [],
    costDrivers: [],
    stats: {},
    stateComparisons: [],
    socialPosts: [],
    quickQuestions: [],
    timelineConfig: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await homepageApi.fetchAllHomepageData(state, timePeriod);
        setData(result);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('Error fetching homepage data:', err);
        }
        setError(err.message);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [state, timePeriod],
  );

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    ...data,
    loading,
    isRefreshing,
    error,
    refresh,
  };
}

/**
 * Hook for fetching wallet shocks
 * @param {string} state - State name
 * @param {number} limit - Number of shocks
 */
export function useWalletShocks(state = 'nationwide', limit = 4) {
  const [shocks, setShocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const data = await homepageApi.fetchWalletShocks(state, limit);
        setShocks(data.shocks || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [state, limit]);

  const addReaction = useCallback(async (shockId, reactionType) => {
    try {
      const data = await homepageApi.addReaction(shockId, reactionType);
      setShocks((prev) =>
        prev.map((shock) =>
          shock._id === shockId ? { ...shock, reactions: data.reactions } : shock,
        ),
      );
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Error adding reaction:', err);
      }
    }
  }, []);

  return { shocks, loading, error, addReaction };
}

/**
 * Hook for fetching cost drivers
 * @param {string} state - State name
 * @param {string} period - Time period
 */
export function useCostDrivers(state = 'nationwide', period = 'YoY') {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const data = await homepageApi.fetchCostDrivers(state, period);
        setDrivers(data.drivers || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [state, period]);

  return { drivers, loading, error };
}

/**
 * Hook for fetching social posts
 * @param {number} limit - Number of posts
 * @param {string} state - Optional state filter
 */
export function useSocialPosts(limit = 6, state = null) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const data = await homepageApi.fetchSocialPosts(limit, state);
        setPosts(data.posts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [limit, state]);

  return { posts, loading, error };
}

/**
 * Hook for fetching product impact data
 * @param {string} product - Product name to search
 * @param {string} state - State name
 */
export function useProductImpact(product, state = 'nationwide') {
  const [impacts, setImpacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!product) {
      setImpacts([]);
      return;
    }

    async function fetch() {
      setLoading(true);
      try {
        const data = await homepageApi.fetchProductImpact(product, state);
        setImpacts(data.impacts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [product, state]);

  return { impacts, loading, error };
}

/**
 * Hook for fetching map data
 */
export function useMapData() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const data = await homepageApi.fetchMapData();
        setRegions(data.regions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { regions, loading, error };
}

/**
 * Hook for fetching nearby shocks
 * @param {string} state - State name
 * @param {number} limit - Number of shocks
 */
export function useNearbyShocks(state = 'nationwide', limit = 5) {
  const [shocks, setShocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const data = await homepageApi.fetchNearbyShocks(state, limit);
        setShocks(data.shocks || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [state, limit]);

  return { shocks, loading, error };
}

export default useHomepageData;
