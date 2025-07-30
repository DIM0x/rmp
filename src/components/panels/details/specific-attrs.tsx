import React from 'react';
import { Box, Text, Heading } from '@chakra-ui/react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useTranslation } from 'react-i18next';
import { AttrsProps, MiscNodeId, StnId } from '../../../constants/constants';
import { useRootDispatch, useRootSelector } from '../../../redux';
import { saveGraph } from '../../../redux/param/param-slice';
import { refreshEdgesThunk, refreshNodesThunk } from '../../../redux/runtime/runtime-slice';
import { makeParallelIndex } from '../../../util/parallel';
import { linePaths, lineStyles } from '../../svgs/lines/lines';
import miscNodes from '../../svgs/nodes/misc-nodes';
import stations from '../../svgs/stations/stations';

const nodes = { ...stations, ...miscNodes };

export const NodeSpecificAttributes = () => {
    const dispatch = useRootDispatch();
    const { selected } = useRootSelector(state => state.runtime);
    const { t } = useTranslation();
    const [id] = selected;
    const [missingImages, setMissingImages] = React.useState<Set<number>>(new Set());
    React.useEffect(() => {
        setMissingImages(new Set());
    }, [id]);

    const type = window.graph.getNodeAttribute(id, 'type');
    const AttrsComponent = type in nodes && (nodes[type].attrsComponent as React.FC<AttrsProps<any>>);
    const attrs = (window.graph.getNodeAttribute(id, type) ?? {}) as any;

    const handleAttrsUpdate = (selectedFirst: string, attrs: any) => {
        const type = window.graph.getNodeAttribute(selectedFirst, 'type');
        window.graph.mergeNodeAttributes(selectedFirst, { [type]: attrs });
        dispatch(refreshNodesThunk());
        dispatch(saveGraph(window.graph.export()));
    };

    const handleImageClick = (imageUrl: string) => {
        window.open(imageUrl, '_blank');
    };
    const handleImageError = (index: number) => {
        setMissingImages(prev => new Set(prev).add(index));
    };
    const imageIndices = Array.from({ length: 5 }, (_, i) => i + 1); //这里修改最多支持的图片数量

    return (
        <>
            {AttrsComponent ? (
                <AttrsComponent id={id} attrs={attrs} handleAttrsUpdate={handleAttrsUpdate} />
            ) : (
                <Text fontSize="xs" m="var(--chakra-space-1)">
                    {t('panel.details.unknown.error', { category: t('panel.details.unknown.node') })}
                </Text>
            )}

            {imageIndices.filter(i => !missingImages.has(i)).length > 0 && (
                <Box mt={4}>
                    <Heading as="h5" size="sm">
                        {t('panel.details.stationPhotos')}
                    </Heading>

                    <Box display="flex" flexDirection="column" gap={2}>
                        {imageIndices.map(index => (
                            !missingImages.has(index) && (
                                <Box 
                                    key={index}
                                    position="relative"
                                    cursor="pointer" // 鼠标指针变为手型提示可点击
                                    _hover={{ opacity: 0.8 }} // 悬停效果
                                >
                                    <LazyLoadImage
                                        src={`stationpics/${id}/${index}.jpg`}
                                        alt={`Stationpics ${index}`}
                                        width="100%" // 宽度占满侧边栏
                                        height="auto" // 高度自适应保持比例
                                        onClick={() => handleImageClick(
                                            `stationpics/${id}/${index}.jpg`
                                        )}
                                        onError={() => handleImageError(index)} // 加载失败时标记为缺失
                                        style={{
                                            aspectRatio: '16/9', // 强制 16:9 宽高比
                                            objectFit: 'cover', // 裁剪多余部分保持比例
                                            borderRadius: 'md', // 圆角
                                            boxShadow: 'sm' // 阴影
                                        }}
                                    />
                                </Box>
                            )
                        ))}
                    </Box>
				</Box>
	        )}
        </>
    );
};

export const LineSpecificAttributes = () => {
    const dispatch = useRootDispatch();
    const {
        preference: { autoParallel },
    } = useRootSelector(state => state.app);
    const { selected } = useRootSelector(state => state.runtime);
    const { t } = useTranslation();
    const [id] = selected;

    const { type, style, parallelIndex, reconcileId } = window.graph.getEdgeAttributes(id);
    const attrs = (window.graph.getEdgeAttribute(id, type) ?? {}) as any;
    const PathAttrsComponent = type in linePaths && linePaths[type].attrsComponent;
    const styleAttrs = (window.graph.getEdgeAttribute(id, style) ?? {}) as any;
    const StyleAttrsComponent = style in lineStyles && lineStyles[style].attrsComponent;

    const recalculateParallelIndex = (id: string, startFrom: 'from' | 'to') => {
        let parallelIndex = -1;
        if (autoParallel) {
            const [source, target] = window.graph.extremities(id) as [StnId | MiscNodeId, StnId | MiscNodeId];
            parallelIndex = makeParallelIndex(window.graph, type, source, target, startFrom);
        }
        window.graph.setEdgeAttribute(id, 'parallelIndex', parallelIndex);
    };
    const handlePathAttrsUpdate = (id: string, attrs: any) => {
        window.graph.mergeEdgeAttributes(id, { [type]: attrs });
        dispatch(refreshEdgesThunk());
        dispatch(saveGraph(window.graph.export()));
    };

    const handleStyleAttrsUpdate = (id: string, attrs: any) => {
        window.graph.mergeEdgeAttributes(id, { [style]: attrs });
        dispatch(refreshEdgesThunk());
        dispatch(saveGraph(window.graph.export()));
    };

    return (
        <>
            {PathAttrsComponent ? (
                <PathAttrsComponent
                    id={id}
                    attrs={attrs}
                    recalculateParallelIndex={recalculateParallelIndex}
                    handleAttrsUpdate={handlePathAttrsUpdate}
                    parallelIndex={parallelIndex}
                />
            ) : (
                <Text fontSize="xs" m="var(--chakra-space-1)">
                    {t('panel.details.unknown.error', { category: t('panel.details.unknown.linePath') })}
                </Text>
            )}
            {StyleAttrsComponent ? (
                <StyleAttrsComponent
                    id={id}
                    attrs={styleAttrs}
                    handleAttrsUpdate={handleStyleAttrsUpdate}
                    reconcileId={reconcileId}
                />
            ) : (
                <Text fontSize="xs" m="var(--chakra-space-1)">
                    {t('panel.details.unknown.error', { category: t('panel.details.unknown.lineStyle') })}
                </Text>
            )}
        </>
    );
};
