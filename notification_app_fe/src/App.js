import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AppBar,
  Toolbar,
  Container,
  Typography,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper
  , Switch, FormControlLabel, Divider
} from "@mui/material";
import { Box } from "@mui/system";
import "./App.css";

// Use a relative path so the CRA dev server proxy (configured in package.json)
// forwards requests to the API host. This avoids browser CORS errors caused by
// duplicate Access-Control-Allow-Origin headers when calling the backend
// directly with an absolute URL.
const API = "/evaluation-service/notifications";
const TOKEN = process.env.REACT_APP_TOKEN;

function App() {
  const [allNotifications, setAllNotifications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [type, setType] = useState("All");
  const [page, setPage] = useState(1);
  const [priorityEnabled, setPriorityEnabled] = useState(true);
  const [priorityN, setPriorityN] = useState(10);

  // FETCH DATA
  const fetchNotifications = async () => {
    try {
      if (!TOKEN) {
        console.warn(
          "REACT_APP_TOKEN is not set. Set it in .env (REACT_APP_TOKEN=your_token) and restart the dev server."
        );
      }

      const headers = TOKEN
        ? { Authorization: `Bearer ${TOKEN}` }
        : {};

      const res = await axios.get(API, { headers });

      console.log("API DATA:", res.data);

      const data = res.data.notifications || [];
      setAllNotifications(data);

    } catch (err) {
      // Improve error output to help debugging (network, auth, etc.)
      const status = err.response?.status;
      const body = err.response?.data || err.message;
      console.error("API ERROR:", { status, body });

      if (status === 401) {
        console.error(
          "Authorization failed (401). Ensure REACT_APP_TOKEN is set and valid."
        );
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Priority logic utilities
  const weightMap = { Placement: 3, Result: 2, Event: 1 };

  class MinHeap {
    constructor(compare) { this.data = []; this.compare = compare; }
    size() { return this.data.length; }
    peek() { return this.data[0]; }
    push(item) { this.data.push(item); this._siftUp(this.data.length - 1); }
    pop() {
      if (this.data.length === 0) return undefined;
      const top = this.data[0]; const last = this.data.pop();
      if (this.data.length > 0) { this.data[0] = last; this._siftDown(0); }
      return top;
    }
    _siftUp(i) { while (i > 0) { const p = Math.floor((i - 1) / 2); if (this.compare(this.data[i], this.data[p]) < 0) { [this.data[i], this.data[p]] = [this.data[p], this.data[i]]; i = p; } else break; } }
    _siftDown(i) { const n = this.data.length; while (true) { let l = 2 * i + 1; let r = 2 * i + 2; let smallest = i; if (l < n && this.compare(this.data[l], this.data[smallest]) < 0) smallest = l; if (r < n && this.compare(this.data[r], this.data[smallest]) < 0) smallest = r; if (smallest !== i) { [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]]; i = smallest; } else break; } }
  }

  function comparator(a, b) {
    if (a.weight !== b.weight) return a.weight - b.weight;
    return a.ts - b.ts;
  }

  function computeTopN(list, n) {
    const heap = new MinHeap(comparator);
    for (const notif of list) {
      const weight = weightMap[notif.Type] || 0;
      const ts = new Date(notif.Timestamp).getTime() || 0;
      const entry = { weight, ts, notif };
      heap.push(entry);
      if (heap.size() > n) heap.pop();
    }
    const res = [];
    while (heap.size() > 0) res.push(heap.pop());
    res.sort((a,b) => { if (b.weight !== a.weight) return b.weight - a.weight; return b.ts - a.ts; });
    return res.map(r => r.notif);
  }

  // Priority list derived from allNotifications; prefer unread if flagged
  const priorityList = useMemo(() => {
    // consider unread flags if present (read / Read)
    const unread = allNotifications.filter(n => {
      if (n.read === false || n.Read === false) return true;
      // if no explicit flag, treat as unread
      return !('read' in n) && !('Read' in n);
    });
    const source = unread.length > 0 ? unread : allNotifications;
    return computeTopN(source, priorityN);
  }, [allNotifications, priorityN]);

  // FILTER + PAGINATION
  useEffect(() => {
    let data = [...allNotifications];

    if (type !== "All") {
      data = data.filter(
        (n) => n.Type?.toLowerCase() === type.toLowerCase()
      );
    }

    const start = (page - 1) * 10;
    const paginated = data.slice(start, start + 10);

    setNotifications(paginated);
  }, [allNotifications, type, page]);

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Notifications
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md">
        <Paper className="panel" elevation={3}>
          <Box sx={{ padding: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <Typography variant="h5" gutterBottom>
                  Notifications
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <FormControlLabel
                      control={<Switch checked={priorityEnabled} onChange={(e) => setPriorityEnabled(e.target.checked)} />}
                      label="Priority Inbox"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    {priorityEnabled && (
                      <Select value={priorityN} onChange={(e) => setPriorityN(Number(e.target.value))} size="small" fullWidth>
                        <MenuItem value={5}>Top 5</MenuItem>
                        <MenuItem value={10}>Top 10</MenuItem>
                        <MenuItem value={15}>Top 15</MenuItem>
                        <MenuItem value={20}>Top 20</MenuItem>
                      </Select>
                    )}
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

      {/* FILTER */}
      <Grid container spacing={1} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={8}>
          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            fullWidth
          >
        <MenuItem value="All">All</MenuItem>
        <MenuItem value="Placement">Placement</MenuItem>
        <MenuItem value="Result">Result</MenuItem>
        <MenuItem value="Event">Event</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button variant="outlined" fullWidth onClick={() => fetchNotifications()}>Refresh</Button>
        </Grid>
      </Grid>

            <Typography className="count" sx={{ mt: 1 }}>
              Notifications shown: {notifications.length}
            </Typography>

            {priorityEnabled && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6">Priority Inbox — Top {priorityN}</Typography>
                {priorityList.length === 0 ? (
                  <div className="empty-state">
                    <Typography variant="body2">No priority notifications</Typography>
                  </div>
                ) : (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {priorityList.map((n, i) => (
                      <Grid item xs={12} key={`p-${i}`}>
                        <Card className="notif-card" elevation={4}>
                          <CardContent>
                            <Grid container spacing={1} alignItems="center">
                              <Grid item xs>
                                <Typography variant="subtitle1" className="message">
                                  {n.Message}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {new Date(n.Timestamp).toLocaleString()}
                                </Typography>
                              </Grid>
                              <Grid item>
                                <Chip label={n.Type || "Unknown"} color="secondary" />
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
                <Divider sx={{ my: 2 }} />
              </>
            )}

      {/* LIST */}
            {/* LIST */}
            {notifications.length === 0 ? (
              <div className="empty-state">
                <Typography variant="h6">No notifications found</Typography>
                <Typography variant="body2" color="textSecondary">
                  Try changing the filter or check your API token.
                </Typography>
              </div>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {notifications.map((n, i) => (
                  <Grid item xs={12} key={i}>
                    <Card className="notif-card" elevation={2}>
                      <CardContent>
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs>
                            <Typography variant="h6" className="message">
                              {n.Message}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {new Date(n.Timestamp).toLocaleString()}
                            </Typography>
                          </Grid>
                          <Grid item>
                            <Chip label={n.Type || "Unknown"} color="primary" />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

      {/* PAGINATION */}
            {/* PAGINATION */}
            <Box className="pagination" sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                PREV
              </Button>

              <Typography sx={{ mx: 2, alignSelf: 'center' }}>Page {page}</Typography>

              <Button
                variant="contained"
                onClick={() => setPage(page + 1)}
              >
                NEXT
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
}

export default App;