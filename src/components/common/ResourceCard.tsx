import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Resource } from '../../types/resources';
import { colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import FilePreviewThumbnail from './FilePreviewThumbnail';
import LoadingPlaceholder from './LoadingPlaceholder';
import useLazyLoading from '../../hooks/useLazyLoading';

interface ResourceCardProps {
  resource: Resource;
  onPress: (resource: Resource) => void;
  onBookmarkToggle?: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  showDeleteButton?: boolean;
  isSelected?: boolean;
  onSelect?: (resource: Resource) => void;
  selectionMode?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = memo(({ 
  resource, 
  onPress, 
  onBookmarkToggle, 
  onDelete, 
  showDeleteButton = false,
  isSelected = false,
  onSelect,
  selectionMode = false
}) => {
  const { isVisible, ref, hasBeenVisible } = useLazyLoading({ threshold: 0.1 });
  const handleCardPress = () => {
    if (selectionMode && onSelect) {
      onSelect(resource);
    } else {
      onPress(resource);
    }
  };

  const formatFileSize = useMemo(() => (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }, []);

  const resourceTypeLabel = useMemo(() => {
    switch (resource.resourceType) {
      case 'document': return 'Document';
      case 'image': return 'Image';
      case 'video': return 'Video';
      case 'book': return 'Book';
      case 'link': return 'Link';
      default: return 'File';
    }
  }, [resource.resourceType]);

  const resourceTypeColor = useMemo(() => {
    switch (resource.resourceType) {
      case 'document': return '#3B82F6';
      case 'image': return '#10B981';
      case 'video': return '#F59E0B';
      case 'book': return '#8B5CF6';
      case 'link': return '#06B6D4';
      default: return colors.textSecondary;
    }
  }, [resource.resourceType]);

  if (!hasBeenVisible) {
    return (
      <View ref={ref} style={styles.card}>
        <LoadingPlaceholder type="card" />
      </View>
    );
  }

  return (
    <TouchableOpacity 
      ref={ref}
      style={[
        styles.card, 
        isSelected && styles.cardSelected,
        selectionMode && styles.cardSelectionMode
      ]} 
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      {selectionMode && (
        <View style={styles.selectionIndicator}>
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={24}
            color={colors.primary}
          />
        </View>
      )}
      
      {/* Thumbnail Container */}
      <View style={styles.thumbnailContainer}>
        <FilePreviewThumbnail
          resourceType={resource.resourceType}
          fileType={resource.fileType}
          thumbnailUrl={resource.thumbnailUrl}
          size={72}
        />
        {/* Resource Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: resourceTypeColor }]}>
          <Text style={styles.typeBadgeText}>{resourceTypeLabel}</Text>
        </View>
      </View>
      
      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {resource.title}
          </Text>
          {!selectionMode && (
            <View style={styles.quickActions}>
              {onBookmarkToggle && (
                <TouchableOpacity 
                  onPress={() => onBookmarkToggle(resource)} 
                  style={styles.quickActionButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={resource.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={resource.isBookmarked ? colors.primary : colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
              {showDeleteButton && onDelete && (
                <TouchableOpacity 
                  onPress={() => onDelete(resource)} 
                  style={styles.quickActionButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={colors.error}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Description */}
        {resource.description && (
          <Text style={styles.description} numberOfLines={2}>
            {resource.description}
          </Text>
        )}

        {/* Metadata Row */}
        <View style={styles.metadataRow}>
          <View style={styles.metadataLeft}>
            {resource.subject && (
              <View style={styles.metadataChip}>
                <Ionicons name="library-outline" size={12} color={colors.primary} />
                <Text style={styles.metadataText}>{resource.subject}</Text>
              </View>
            )}
            {resource.gradeLevel && (
              <View style={styles.metadataChip}>
                <Ionicons name="school-outline" size={12} color={colors.primary} />
                <Text style={styles.metadataText}>{resource.gradeLevel}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.metadataRight}>
            {resource.fileSize && (
              <Text style={styles.fileSizeText}>
                {formatFileSize(resource.fileSize)}
              </Text>
            )}
          </View>
        </View>

        {/* Preview Hint */}
        <View style={styles.previewHint}>
          {resource.resourceType === 'image' ? (
            <>
              <Ionicons name="eye-outline" size={14} color={colors.primary} />
              <Text style={styles.previewHintText}>Tap to preview</Text>
            </>
          ) : (
            <>
              <Ionicons name="open-outline" size={14} color={colors.primary} />
              <Text style={styles.previewHintText}>Tap to open with app</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border || 'rgba(0,0,0,0.05)',
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight || `${colors.primary}10`,
    shadowOpacity: 0.15,
  },
  cardSelectionMode: {
    paddingLeft: 12,
  },
  selectionIndicator: {
    position: 'absolute',
    left: 12,
    top: 16,
    zIndex: 1,
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: 16,
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
    marginRight: 8,
    lineHeight: 22,
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionButton: {
    padding: 4,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: colors.background || 'rgba(0,0,0,0.02)',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  metadataRight: {
    marginLeft: 8,
  },
  metadataChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background || 'rgba(0,0,0,0.02)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  fileSizeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    backgroundColor: colors.background || 'rgba(0,0,0,0.02)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  previewHint: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewHintText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default ResourceCard;
