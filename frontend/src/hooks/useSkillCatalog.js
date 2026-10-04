import { useEffect, useState } from 'react';
import api from '../api';

let cache = null; // the catalogue rarely changes – fetch once per page load

export default function useSkillCatalog() {
  const [skills, setSkills] = useState(cache || []);
  useEffect(() => {
    if (cache) return;
    api.get('/skills').then((r) => { cache = r.data; setSkills(r.data); }).catch(() => {});
  }, []);
  return skills;
}
