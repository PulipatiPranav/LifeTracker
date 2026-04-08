import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Habits from '@/pages/Habits';
import Sleep from '@/pages/Sleep';
import Screentime from '@/pages/Screentime';
import Workouts from '@/pages/Workouts';
import Nutrition from '@/pages/Nutrition';
import Hydration from '@/pages/Hydration';
import Mood from '@/pages/Mood';
import BodyMetrics from '@/pages/BodyMetrics';
import Focus from '@/pages/Focus';
import Finance from '@/pages/Finance';
import Goals from '@/pages/Goals';
import Patterns from '@/pages/Patterns';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/sleep" element={<Sleep />} />
          <Route path="/screentime" element={<Screentime />} />
          <Route path="/workouts" element={<Workouts />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/hydration" element={<Hydration />} />
          <Route path="/mood" element={<Mood />} />
          <Route path="/body" element={<BodyMetrics />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/patterns" element={<Patterns />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
