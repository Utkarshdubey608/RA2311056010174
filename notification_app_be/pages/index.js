import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { Container, Typography, AppBar, Toolbar, Select, MenuItem, Grid, Paper, Box, Button } from '@mui/material';
import NotificationCard from '../components/NotificationCard';
import axios from 'axios';

export default function Home() {
  const [list, setList] = useState([]);
  const [type, setType] = useState('All');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [viewedIds, setViewedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('viewedNotifications');
    if (raw) setViewedIds(new Set(JSON.parse(raw)));
  }, []);

  useEffect(() => { fetchData(); }, [type, page]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = { limit, page };
      if (type !== 'All') params.notification_type = type;
      const res = await axios.get('/api/notifications', { params });
      setList(res.data.notifications || res.data || []);
    } catch (err) {
      console.error(err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  function markViewed(id) {
    const s = new Set(viewedIds);
    s.add(id);
    setViewedIds(s);
    localStorage.setItem('viewedNotifications', JSON.stringify(Array.from(s)));
  }

  return (
    <>
      <Head><title>All Notifications</title></Head>
      <AppBar position="static"><Toolbar><Typography variant="h6">Campus Notifications</Typography></Toolbar></AppBar>
      <Container maxWidth="md" sx={{ mt: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}><Typography variant="h5">All Notifications</Typography></Grid>
            <Grid item xs={12} sm={4}>
              <Select fullWidth value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Placement">Placement</MenuItem>
                <MenuItem value="Result">Result</MenuItem>
                <MenuItem value="Event">Event</MenuItem>
              </Select>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            {loading ? <Typography>Loading...</Typography> : (
              list.length === 0 ? <Typography>No notifications</Typography> : list.map((n, i) => (
                <div key={i} onClick={() => markViewed(n.id || n.Timestamp + '-' + i)}>
                  <NotificationCard notif={n} viewed={viewedIds.has(n.id || n.Timestamp + '-' + i)} />
                </div>
              ))
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <Typography sx={{ alignSelf: 'center' }}>Page {page}</Typography>
            <Button onClick={() => setPage(page + 1)}>Next</Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
