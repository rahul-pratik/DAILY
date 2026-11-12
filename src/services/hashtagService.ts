import { supabase } from '../lib/supabase';
import { StorageService } from './storageService';

const normalizeHashtag = (tag: string) => {
  const cleaned = tag.trim().replace(/^#+/, '').replace(/\s+/g, ' ').trim();
  return cleaned ? `#${cleaned}` : '';
};

const uniqueHashtags = (tags: string[]) => {
  const unique = new Map<string, string>();
  tags.forEach((tag) => {
    const canonical = normalizeHashtag(tag);
    if (canonical && !unique.has(canonical.toLowerCase())) {
      unique.set(canonical.toLowerCase(), canonical);
    }
  });
  return Array.from(unique.values());
};

export const loadKnownHashtags = async (): Promise<string[]> => {
  const { data, error } = await supabase.from('topic_hashtags').select('tag').order('tag');
  if (error) throw error;
  return uniqueHashtags([
    ...StorageService.getAllKnownHashtags(),
    ...((data || []).map((row) => row.tag as string)),
  ]);
};

export const addKnownHashtag = async (
  input: string
): Promise<{ canonicalTag: string; isNew: boolean; shared: boolean }> => {
  const canonicalInput = normalizeHashtag(input);
  if (!canonicalInput) {
    throw new Error('Enter a hashtag before adding it.');
  }
  const tagKey = canonicalInput.toLowerCase();
  const localMatch = StorageService.getAllKnownHashtags()
    .find((tag) => tag.toLowerCase() === tagKey);

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session?.user) {
    const localResult = StorageService.addCustomHashtag(canonicalInput);
    return { canonicalTag: localResult.canonicalTag, isNew: localResult.isNew, shared: false };
  }

  const { data: existing, error: lookupError } = await supabase
    .from('topic_hashtags')
    .select('tag')
    .eq('tag_key', tagKey)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) {
    StorageService.addCustomHashtag(existing.tag);
    return { canonicalTag: existing.tag, isNew: false, shared: true };
  }

  const canonicalTag = localMatch || canonicalInput;
  const { error: insertError } = await supabase.from('topic_hashtags').insert({
    tag_key: tagKey,
    tag: canonicalTag,
    created_by: sessionData.session.user.id,
  });
  if (insertError) {
    if (insertError.code === '23505') {
      const { data: duplicate, error: duplicateError } = await supabase
        .from('topic_hashtags')
        .select('tag')
        .eq('tag_key', tagKey)
        .maybeSingle();
      if (duplicateError) throw duplicateError;
      if (duplicate) {
        StorageService.addCustomHashtag(duplicate.tag);
        return { canonicalTag: duplicate.tag, isNew: false, shared: true };
      }
    }
    throw insertError;
  }

  StorageService.addCustomHashtag(canonicalTag);
  return { canonicalTag, isNew: true, shared: true };
};
