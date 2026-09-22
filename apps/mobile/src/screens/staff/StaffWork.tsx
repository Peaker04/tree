import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Card, EmptyState, SectionTitle } from '../../components/AppPrimitives';
import { TaskCard } from '../../components/presentation/TaskSurfaces';
import { TaskStatusFilters } from '../../components/presentation/TreeSurfaces';
import { colors } from '../../theme/tokens';
import { Task } from '../../types';
import { TaskFilter } from '../../domain/mobileWorkflow';

export function StaffWork({
  openTaskCount,
  visibleTasks,
  totalTasks,
  activeFilter,
  onFilterChange,
  onOpenTask,
}: {
  openTaskCount: number;
  visibleTasks: Task[];
  totalTasks: number;
  activeFilter: TaskFilter;
  onFilterChange: (value: TaskFilter) => void;
  onOpenTask: (task: Task) => void;
}) {
  return (
    <FlatList
      data={visibleTasks}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.screenPad}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      ListHeaderComponent={
        <View style={styles.headerContainer}>
          <View style={styles.headerBlock}>
            <View>
              <Text style={styles.mutedSmall}>Danh sách nhiệm vụ</Text>
              <Text style={styles.pageTitle}>Công việc của bạn</Text>
            </View>
            <Badge tone="green">{openTaskCount} việc mở</Badge>
          </View>
          <Card tone="warm" style={styles.workHeroCard}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Text style={styles.lightHeroTitle}>Ưu tiên việc cần check-in</Text>
                <Text style={styles.lightHeroBody}>
                  Mở từng nhiệm vụ để xác minh GPS, quét QR, chụp ảnh và gửi nghiệm thu.
                </Text>
              </View>
              <Ionicons name="clipboard-outline" size={34} color={colors.primaryDark} />
            </View>
          </Card>

          <TaskStatusFilters
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            resultCount={visibleTasks.length}
            totalCount={totalTasks}
          />

          <SectionTitle icon="clipboard-outline">Nhiệm vụ của bạn ({visibleTasks.length})</SectionTitle>

          {totalTasks === 0 ? (
            <EmptyState title="Không có việc tồn đọng" body="Khi quản lý phân công, nhiệm vụ sẽ xuất hiện tại đây." />
          ) : visibleTasks.length === 0 ? (
            <EmptyState
              icon="funnel-outline"
              title="Không có nhiệm vụ trong bộ lọc"
              body="Đổi trạng thái để xem các việc đang chờ bắt đầu, chờ duyệt hoặc đã hoàn thành."
            />
          ) : null}
        </View>
      }
      renderItem={({ item: task }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Mở công việc {task.title}`}
          onPress={() => onOpenTask(task)}
        >
          <TaskCard task={task} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screenPad: {
    padding: 16,
    paddingBottom: 104,
  },
  headerContainer: {
    gap: 16,
    marginBottom: 16, // gap between header and first list item
  },
  flex: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mutedSmall: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  pageTitle: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '600',
  },
  workHeroCard: {
    minHeight: 132,
  },
  lightHeroTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '600',
  },
  lightHeroBody: {
    color: colors.foregroundSoft,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 6,
  },
});
