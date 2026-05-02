import axios from 'axios';

export default async function handler(req, res) {
  try {
    const { limit, page, notification_type } = req.query;
    const params = {};
    if (limit) params.limit = limit;
    if (page) params.page = page;
    if (notification_type) params.notification_type = notification_type;

    const apiRes = await axios.get('http://20.207.122.201/evaluation-service/notifications', {
      params,
      timeout: 5000
    });

    res.status(apiRes.status).json(apiRes.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const data = err.response?.data || { message: err.message };
    res.status(status).json(data);
  }
}
