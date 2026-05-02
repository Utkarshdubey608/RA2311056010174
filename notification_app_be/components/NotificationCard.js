import React from 'react';
import { Card, CardContent, Typography, Grid, Chip } from '@mui/material';

export default function NotificationCard({ notif, viewed }) {
  return (
    <Card elevation={viewed ? 1 : 6} sx={{ mb: 2, borderLeft: viewed ? '4px solid transparent' : '4px solid #1976d2' }}>
      <CardContent>
        <Grid container alignItems="center" spacing={1}>
          <Grid item xs>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{notif.Message}</Typography>
            <Typography variant="body2" color="text.secondary">{new Date(notif.Timestamp).toLocaleString()}</Typography>
          </Grid>
          <Grid item>
            <Chip label={notif.Type} color={notif.Type === 'Placement' ? 'primary' : notif.Type === 'Result' ? 'success' : 'default'} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
