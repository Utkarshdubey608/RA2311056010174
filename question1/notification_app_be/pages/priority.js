import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Container, Typography, AppBar, Toolbar, Select, MenuItem, Grid, Paper, Box } from '@mui/material';
import NotificationCard from '../components/NotificationCard';
import axios from 'axios';

const weightMap = { Placement: 3, Result: 2, Event: 1 };

function computeTopN(list, n) {
  // simple sort since small demo; for streaming use heap
  const mapped = list.map(nf => ({ w: weightMap[nf.Type] || 0, ts: new Date(nf.Timestamp).getTime() || 0, nf }));
  mapped.sort((a,b) => { if (b.w !== a.w) return b.w - a.w; return b.ts - a.ts; });
  return mapped.slice(0, n).map(m => m.nf);
}

export default function PriorityPage() {
  const [all, setAll] = useState([]);
  const [n, setN] = useState(10);
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const res = await axios.get('/api/notifications', { params: { limit: 200 } });
      setAll(res.data.notifications || res.data || []);
    } catch (err) { console.error(err); setAll([]); }
  }

  const filtered = useMemo(() => {
    if (typeFilter === 'All') return all;
    return all.filter(x => x.Type === typeFilter);
  }, [all, typeFilter]);

  const top = useMemo(() => computeTopN(filtered, n), [filtered, n]);

  return (
    <>
      <Head><title>Priority Inbox</title></Head>
      <AppBar position="static"><Toolbar><Typography variant="h6">Priority Inbox</Typography></Toolbar></AppBar>
      <Container maxWidth="md" sx={{ mt: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}><Typography variant="h5">Priority Inbox</Typography></Grid>
            <Grid item xs={6} sm={3}>
              <Select fullWidth value={n} onChange={(e) => setN(Number(e.target.value))}>
                <MenuItem value={5}>Top 5</MenuItem>
                <MenuItem value={10}>Top 10</MenuItem>
                <MenuItem value={15}>Top 15</MenuItem>
                <MenuItem value={20}>Top 20</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Select fullWidth value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value={'All'}>All</MenuItem>
                <MenuItem value={'Placement'}>Placement</MenuItem>
                <MenuItem value={'Result'}>Result</MenuItem>
                <MenuItem value={'Event'}>Event</MenuItem>
              </Select>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            {top.length === 0 ? <Typography>No priority notifications</Typography> : top.map((t,i) => (
              <NotificationCard key={i} notif={t} viewed={false} />
            ))}
          </Box>
        </Paper>
      </Container>
    </>
  );
}
