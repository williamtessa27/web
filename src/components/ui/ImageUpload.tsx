import { useRef, useState } from 'react';
import { HiOutlinePhoto, HiOutlineBuildingOffice2, HiOutlineUser } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { uploadApi } from '@/core/api';
import clsx from 'clsx';

type Size = 'sm' | 'md' | 'lg';
type Shape = 'circle' | 'square';

const sizeClasses: Record<Size, string> = {
  sm: 'w-12 h-12 text-base',
  md: 'w-24 h-24 text-2xl',
  lg: 'w-32 h-32 text-3xl',
};

export interface ImageUploadProps {
  /** URL de l'image affichée (ou undefined pour le placeholder). */
  value?: string | null;
  /** Appelé après un upload réussi avec l’URL à enregistrer (secureUrl). */
  onChange?: (url: string) => void;
  /** Afficher le bouton / zone cliquable pour uploader. */
  editable?: boolean;
  /** Type de placeholder quand pas d’image : initials (texte), logo (entreprise), user (avatar). */
  placeholderType?: 'initials' | 'logo' | 'user';
  /** Texte pour le placeholder initials (ex. "JD"). */
  placeholderText?: string;
  /** Dossier Cloudinary optionnel (ex. "collect_app/entreprises"). */
  folder?: string;
  size?: Size;
  shape?: Shape;
  /** Désactivé pendant l’upload. */
  disabled?: boolean;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  editable = false,
  placeholderType = 'user',
  placeholderText,
  folder = 'collect_app',
  size = 'md',
  shape = 'circle',
  disabled = false,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onChange) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image (JPG, PNG, etc.).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L’image ne doit pas dépasser 5 Mo.');
      return;
    }
    setUploading(true);
    e.target.value = '';
    try {
      const res = await uploadApi.image(file, folder);
      onChange(res.secureUrl);
      toast.success('Image enregistrée.');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de l’upload.');
    } finally {
      setUploading(false);
    }
  }

  const PlaceholderIcon =
    placeholderType === 'logo' ? HiOutlineBuildingOffice2 : HiOutlineUser;

  const content = value?.trim() ? (
    <img
      src={value}
      alt=""
      className={clsx(
        'object-cover w-full h-full',
        shape === 'circle' && 'rounded-full',
        shape === 'square' && 'rounded-lg',
      )}
    />
  ) : placeholderText ? (
    <span className="font-bold text-primary-700">
      {placeholderText.slice(0, 2).toUpperCase()}
    </span>
  ) : (
    <PlaceholderIcon className="w-1/2 h-1/2 text-gray-400" />
  );

  return (
    <div className={clsx('flex flex-col items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => editable && !disabled && !uploading && inputRef.current?.click()}
        disabled={disabled || uploading}
        className={clsx(
          'flex items-center justify-center overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 transition-colors',
          sizeClasses[size],
          shape === 'circle' && 'rounded-full',
          shape === 'square' && 'rounded-lg',
          editable && !disabled && 'cursor-pointer hover:border-primary-300 hover:bg-primary-50',
          (disabled || uploading) && 'opacity-60 cursor-not-allowed',
        )}
      >
        {uploading ? (
          <span className="text-xs text-gray-500">Chargement…</span>
        ) : (
          content
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      {editable && !disabled && (
        <span className="text-xs text-gray-500">
          {value ? 'Cliquer pour changer' : 'Cliquer pour ajouter une image'}
        </span>
      )}
    </div>
  );
}
