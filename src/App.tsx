import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import './App.css';

import { auth } from './firebase';
import type { Plant, PlantFormValues } from './types/plant';
import {
  createPlant,
  deletePlant,
  subscribePlants,
  updatePlant,
  updateWateredAt,
} from './services/plantService';

import Home from './Home';
import AddEditPlant from './pages/AddEditPlant';
import PlantDetail from './pages/PlantDetail';

type PageMode = 'home' | 'add' | 'edit' | 'detail';

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${date}`;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantsLoading, setPlantsLoading] = useState(false);
  const [pageMode, setPageMode] = useState<PageMode>('home');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (!currentUser) {
        setPlants([]);
        setSelectedPlant(null);
        setPageMode('home');
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setPlantsLoading(true);

    const unsubscribePlants = subscribePlants(
      user.uid,
      (nextPlants) => {
        setPlants(nextPlants);
        setPlantsLoading(false);
      },
      (error) => {
        console.error(error);
        setPlantsLoading(false);
        alert('식물 정보를 불러오지 못했습니다.');
      }
    );

    return () => unsubscribePlants();
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      alert('Google 로그인에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
      alert('로그아웃에 실패했습니다.');
    }
  };

  const handleAddPlant = () => {
    setSelectedPlant(null);
    setPageMode('add');
  };

  const handleSelectPlant = (plant: Plant) => {
    setSelectedPlant(plant);
    setPageMode('detail');
  };

  const handleEditPlant = (plant: Plant) => {
    setSelectedPlant(plant);
    setPageMode('edit');
  };

  const handleCancel = () => {
    setPageMode(selectedPlant ? 'detail' : 'home');
  };

  const handleBackHome = () => {
    setSelectedPlant(null);
    setPageMode('home');
  };

  const handleSavePlant = async (values: PlantFormValues) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      if (pageMode === 'edit' && selectedPlant) {
        await updatePlant(selectedPlant.id, values);

        setSelectedPlant({
          ...selectedPlant,
          ...values,
          updatedAt: new Date().toISOString(),
        });

        setPageMode('detail');
      } else {
        await createPlant(user.uid, values);

        setSelectedPlant(null);
        setPageMode('home');
      }
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : '식물 정보를 저장하지 못했습니다.'
      );
    }
  };

  const handleDeletePlant = async (plantId: string) => {
    try {
      await deletePlant(plantId);

      setSelectedPlant(null);
      setPageMode('home');
    } catch (error) {
      console.error(error);
      alert('식물을 삭제하지 못했습니다.');
    }
  };

  const handleWaterPlant = async (plant: Plant) => {
    try {
      const today = getTodayString();

      await updateWateredAt(plant.id, today);

      setSelectedPlant({
        ...plant,
        lastWateredAt: today,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(error);
      alert('물 준 날짜를 저장하지 못했습니다.');
    }
  };

  if (authLoading) {
    return (
      <div className="app-loading">
        <p>Plant Story를 준비하는 중입니다.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-page">
        <section className="login-card">
          <div className="login-icon" aria-hidden="true">
            <svg
              width="112"
              height="112"
              viewBox="0 0 96 96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="32" y="58" width="32" height="22" rx="6" fill="#D9A066" />
              <path
                d="M48 61C48 44 48 35 48 23"
                stroke="#4F8F62"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M46 39C31 38 23 30 22 18C35 18 45 25 46 39Z"
                fill="#79B77B"
              />
              <path
                d="M50 45C66 44 75 35 76 22C61 22 51 30 50 45Z"
                fill="#67A96B"
              />
              <path
                d="M47 54C34 54 26 47 25 36C38 36 46 42 47 54Z"
                fill="#8BCB8E"
              />
            </svg>
          </div>

          <h1>Plant Story</h1>
          <p>나의 식물 관리 기록을 안전하게 저장하세요.</p>

          <button
            type="button"
            className="google-login-button"
            onClick={handleLogin}
          >
            Google로 시작하기
          </button>
        </section>
      </div>
    );
  }

  if (pageMode === 'add') {
    return (
      <AddEditPlant
        plant={null}
        onSave={handleSavePlant}
        onCancel={handleCancel}
      />
    );
  }

  if (pageMode === 'edit' && selectedPlant) {
    return (
      <AddEditPlant
        plant={selectedPlant}
        onSave={handleSavePlant}
        onCancel={handleCancel}
      />
    );
  }

  if (pageMode === 'detail' && selectedPlant) {
    return (
      <PlantDetail
        plant={selectedPlant}
        onBack={handleBackHome}
        onEdit={handleEditPlant}
        onDelete={handleDeletePlant}
        onWater={handleWaterPlant}
      />
    );
  }

  return (
    <Home
      plants={plants}
      loading={plantsLoading}
      onAddPlant={handleAddPlant}
      onSelectPlant={handleSelectPlant}
      onLogout={handleLogout}
    />
  );
}

export default App;