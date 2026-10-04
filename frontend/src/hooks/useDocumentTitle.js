import { useEffect } from 'react';

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · SkillSwap` : 'SkillSwap – Trade skills, grow together';
  }, [title]);
}
